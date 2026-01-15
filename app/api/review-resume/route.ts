import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider, cleanAIResponse } from '@/lib/ai/provider';
import { calculateEnhancedATSScore, parsePDFContent } from '@/lib/ats/enhanced-scorer';
import { generateAIReview } from '@/lib/ai/review';
import { ResumeData } from '@/types';
import { AuthError, requireAuth } from '@/lib/firebase/server-auth';
import { buildResumeParsingPrompt } from '@/lib/ai/resume-parsing';
import { parseJsonFromText } from '@/lib/ai/json';
import { buildRateLimitHeaders, rateLimit } from '@/lib/server/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);

    const limit = rateLimit(`${uid}:review-resume`, { limit: 3, windowMs: 60_000 });
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait and try again.' },
        { status: 429, headers: buildRateLimitHeaders(limit) }
      );
    }

    const formData = await request.formData();
    const pdfFile = formData.get('pdf') as File;
    const jobDescription = formData.get('jobDescription') as string | null;

    if (!pdfFile) {
      return NextResponse.json(
        { error: 'PDF file is required' },
        { status: 400 }
      );
    }

    // Convert PDF to buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    const pdfText = await parsePDFContent(pdfBuffer);

    // Parse resume data using AI
    const aiProvider = getAIProvider();
    const parsePrompt = buildResumeParsingPrompt(pdfText);
    const parseResult = await aiProvider.generateContent(parsePrompt);
    const cleanedResponse = cleanAIResponse(parseResult.text);

    let resumeData: ResumeData;
    try {
      resumeData = parseJsonFromText<ResumeData>(cleanedResponse);
    } catch (error) {
      console.error('Failed to parse resume data:', error);
      return NextResponse.json(
        { error: 'Failed to extract resume data from PDF' },
        { status: 500 }
      );
    }

    // Calculate enhanced ATS score
    const atsScore = await calculateEnhancedATSScore(
      resumeData,
      jobDescription || undefined,
      pdfBuffer
    );

    // Generate AI review
    const aiReview = await generateAIReview(
      resumeData,
      atsScore,
      jobDescription || undefined
    );

    return NextResponse.json({
      success: true,
      resumeData,
      atsScore,
      aiReview,
    });
  } catch (error: any) {
    console.error('Resume review error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to review resume' },
      { status: 500 }
    );
  }
}
