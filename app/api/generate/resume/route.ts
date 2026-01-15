import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider, cleanAIResponse } from '@/lib/ai/provider';
import { buildResumePrompt } from '@/lib/gemini/prompts';
import { generateTemplatedResumePDF } from '@/lib/pdf/template-renderer';
import { renderCustomTemplate } from '@/lib/pdf/custom-template-renderer';
import { createDocument, getCustomTemplate } from '@/lib/firebase/db-utils';
import { calculateATSScore } from '@/lib/ats/scoring';
import { ResumeData, BuiltInTemplateId } from '@/types';
import { AuthError, requireAuth } from '@/lib/firebase/server-auth';
import { buildDocumentFileName } from '@/lib/utils/file-name';
import { inferJobTitleFromDescription } from '@/lib/utils/job-metadata';
import { parseJsonFromText } from '@/lib/ai/json';
import { buildRateLimitHeaders, rateLimit } from '@/lib/server/rate-limit';
import { enforceMaxBodySize, RequestSizeError } from '@/lib/server/request-size';
import { z } from 'zod';

const generateResumeSchema = z
  .object({
    resumeText: z.string().min(1).optional(),
    resumeData: z.unknown().optional(),
    jobDescription: z.string().nullable().optional(),
    isTailored: z.boolean().optional(),
    templateId: z.string().optional(),
    jobTitle: z.string().optional(),
    company: z.string().optional(),
    title: z.string().optional(),
    jobId: z.string().optional(),
  })
  .refine((data) => Boolean(data.resumeText || data.resumeData), {
    message: 'resumeText or resumeData is required',
  });

export async function POST(request: NextRequest) {
  try {
    const { uid, name, email } = await requireAuth(request);

    const limit = rateLimit(`${uid}:generate-resume`, { limit: 5, windowMs: 60_000 });
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait and try again.' },
        { status: 429, headers: buildRateLimitHeaders(limit) }
      );
    }

    enforceMaxBodySize(request, 512 * 1024);

    const body = await request.json();
    const parsed = generateResumeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      resumeText,
      resumeData: providedResumeData,
      jobDescription,
      isTailored,
      templateId,
      jobTitle,
      company,
      title,
      jobId,
    } = parsed.data;

    const jobDescriptionForPrompt = typeof jobDescription === 'string' ? jobDescription : null;
    const jobDescriptionForScoring = typeof jobDescription === 'string' ? jobDescription : undefined;

    // Use templateId if provided, otherwise default to 'modern'
    const selectedTemplate: string = templateId || 'modern';

    let resumeData: ResumeData;

    if (providedResumeData) {
      resumeData = providedResumeData as ResumeData;
    } else {
      if (!resumeText) {
        return NextResponse.json(
          { error: 'resumeText is required when resumeData is not provided' },
          { status: 400 }
        );
      }

      // Generate resume data using AI (with automatic fallback)
      const aiProvider = getAIProvider();
      const prompt = buildResumePrompt(resumeText, jobDescriptionForPrompt, Boolean(isTailored));
      const result = await aiProvider.generateContent(prompt);
      const cleanedResponse = cleanAIResponse(result.text);

      try {
        resumeData = parseJsonFromText<ResumeData>(cleanedResponse);
      } catch (error) {
        console.error('Failed to parse AI response:', error);
        return NextResponse.json(
          { error: 'Failed to generate resume data' },
          { status: 500 }
        );
      }
    }

    // Calculate ATS score
    const atsScore = calculateATSScore(resumeData, jobDescriptionForScoring);

    // Generate PDF using selected template (built-in or custom)
    let pdfBuffer: Buffer;

    if (selectedTemplate.startsWith('custom-')) {
      // Custom template - fetch and render
      const customTemplateId = selectedTemplate.replace('custom-', '');

      const customTemplate = await getCustomTemplate(customTemplateId);
      if (!customTemplate || customTemplate.userId !== uid) {
        return NextResponse.json(
          { error: 'Custom template not found' },
          { status: 404 }
        );
      }

      pdfBuffer = await renderCustomTemplate(resumeData, customTemplate);
    } else {
      // Built-in template
      pdfBuffer = await generateTemplatedResumePDF(resumeData, selectedTemplate as BuiltInTemplateId);
    }

    // Create document record in Firestore
    const variant = isTailored ? 'tailored' : 'general';

    const candidateName =
      resumeData?.contactInfo?.name ||
      name ||
      (email ? email.split('@')[0] : undefined);

    const inferredJobTitle = jobTitle || inferJobTitleFromDescription(jobDescription);
    const finalJobTitle = inferredJobTitle || undefined;
    const finalCompany = typeof company === 'string' && company.trim() ? company.trim() : undefined;

    const fileName = buildDocumentFileName({
      type: 'resume',
      variant,
      candidateName: candidateName || undefined,
      jobTitle: finalJobTitle,
      company: finalCompany,
    });

    const documentData: any = {
      userId: uid,
      type: 'resume',
      variant,
      data: resumeData,
      fileName,
      templateId: selectedTemplate,
      atsScore,
    };

    // Only include jobDescription if it exists (Firestore doesn't allow undefined)
    if (jobDescriptionForScoring) {
      documentData.jobDescription = jobDescriptionForScoring;
    }

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
      resumeData,
      pdf: pdfBase64,
      fileName,
      atsScore,
    });
  } catch (error: any) {
    console.error('Resume generation error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof RequestSizeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to generate resume' },
      { status: 500 }
    );
  }
}
