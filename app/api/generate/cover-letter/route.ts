import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai/provider';
import { buildCoverLetterPrompt } from '@/lib/gemini/prompts';
import {
  generateCoverLetterPDF,
  cleanCoverLetterContent,
} from '@/lib/pdf/cover-letter-generator';
import { createDocument } from '@/lib/firebase/db-utils';
import { AuthError, requireAuth } from '@/lib/firebase/server-auth';
import { buildDocumentFileName } from '@/lib/utils/file-name';
import { inferJobTitleFromDescription } from '@/lib/utils/job-metadata';
import { buildRateLimitHeaders, rateLimit } from '@/lib/server/rate-limit';
import { enforceMaxBodySize, RequestSizeError } from '@/lib/server/request-size';
import { z } from 'zod';

const coverLetterSchema = z
  .object({
    resumeText: z.string().min(1).optional(),
    resumeData: z.unknown().optional(),
    jobDescription: z.string().min(1),
    jobTitle: z.string().optional(),
    company: z.string().optional(),
    title: z.string().optional(),
    jobId: z.string().optional(),
    coverLetterOptions: z
      .object({
        tone: z.enum(['professional', 'friendly', 'bold']).optional(),
        length: z.enum(['short', 'medium', 'long']).optional(),
        format: z.enum(['paragraphs', 'bullets']).optional(),
      })
      .optional(),
  })
  .refine((data) => Boolean(data.resumeText || data.resumeData), {
    message: 'resumeText or resumeData is required',
  });

export async function POST(request: NextRequest) {
  try {
    const { uid, name, email } = await requireAuth(request);

    const limit = rateLimit(`${uid}:generate-cover-letter`, { limit: 5, windowMs: 60_000 });
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait and try again.' },
        { status: 429, headers: buildRateLimitHeaders(limit) }
      );
    }

    enforceMaxBodySize(request, 512 * 1024);

    const body = await request.json();
    const parsed = coverLetterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      resumeText,
      resumeData,
      jobDescription,
      jobTitle,
      company,
      title,
      jobId,
      coverLetterOptions,
    } = parsed.data;

    const resumeInput =
      typeof resumeText === 'string' && resumeText.trim().length > 0
        ? resumeText
        : JSON.stringify(resumeData || {});

    // Generate cover letter content using AI (with automatic fallback)
    const aiProvider = getAIProvider();
    const prompt = buildCoverLetterPrompt(resumeInput, jobDescription, coverLetterOptions);
    const result = await aiProvider.generateContent(prompt);
    const rawContent = result.text;
    const cleanedContent = cleanCoverLetterContent(rawContent);

    // Generate PDF
    const pdfBuffer = await generateCoverLetterPDF(cleanedContent);

    // Create document record in Firestore
    const resumeDataObj: any = resumeData;
    const candidateName =
      resumeDataObj?.contactInfo?.name ||
      name ||
      (email ? email.split('@')[0] : undefined);

    const inferredJobTitle = jobTitle || inferJobTitleFromDescription(jobDescription);
    const finalJobTitle = inferredJobTitle || undefined;
    const finalCompany = typeof company === 'string' && company.trim() ? company.trim() : undefined;

    const fileName = buildDocumentFileName({
      type: 'cover_letter',
      variant: 'tailored',
      candidateName: candidateName || undefined,
      jobTitle: finalJobTitle,
      company: finalCompany,
    });

    const documentData: any = {
      userId: uid,
      type: 'cover_letter',
      variant: 'tailored',
      data:
        resumeData || {
          contactInfo: {},
          summary: '',
          experience: [],
          education: [],
          projects: [],
          skills: { technical: [], soft: [] },
          achievements: [],
          certifications: [],
          languages: [],
          interests: [],
        },
      fileName,
      jobDescription,
      content: cleanedContent,
    };

    if (finalJobTitle) {
      documentData.jobTitle = finalJobTitle;
    }

    if (finalCompany) {
      documentData.company = finalCompany;
    }

    if (typeof title === 'string' && title.trim()) {
      documentData.title = title.trim();
    }

    if (typeof jobId === 'string' && jobId.trim()) {
      documentData.jobId = jobId.trim();
    }

    const documentId = await createDocument(documentData);

    // Return PDF as base64 for download
    const pdfBase64 = pdfBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      documentId,
      content: cleanedContent,
      pdf: pdfBase64,
      fileName,
    });
  } catch (error: any) {
    console.error('Cover letter generation error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof RequestSizeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to generate cover letter' },
      { status: 500 }
    );
  }
}
