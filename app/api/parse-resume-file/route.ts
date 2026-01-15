import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider, cleanAIResponse } from '@/lib/ai/provider';
import { AuthError, requireAuth } from '@/lib/firebase/server-auth';
import { parsePDFContent } from '@/lib/ats/enhanced-scorer';
import { buildResumeParsingPrompt } from '@/lib/ai/resume-parsing';
import type { ResumeData } from '@/types';
import { parseJsonFromText } from '@/lib/ai/json';
import { buildRateLimitHeaders, rateLimit } from '@/lib/server/rate-limit';

function isPdfFile(file: File): boolean {
  if (file.type === 'application/pdf') return true;
  return file.name.toLowerCase().endsWith('.pdf');
}

export async function POST(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);

    const limit = rateLimit(`${uid}:parse-resume-file`, { limit: 10, windowMs: 60_000 });
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait and try again.' },
        { status: 429, headers: buildRateLimitHeaders(limit) }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const resumeText = isPdfFile(file) ? await parsePDFContent(buffer) : buffer.toString('utf-8');

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: 'File appears to be empty or too short to parse' },
        { status: 422 }
      );
    }

    const aiProvider = getAIProvider();
    const prompt = buildResumeParsingPrompt(resumeText);
    const result = await aiProvider.generateContent(prompt);
    const cleanedResponse = cleanAIResponse(result.text);

    let parsedData: ResumeData;
    try {
      parsedData = parseJsonFromText<ResumeData>(cleanedResponse);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return NextResponse.json(
        { error: 'Failed to parse resume data. Please try again.' },
        { status: 500 }
      );
    }

    if (!parsedData.contactInfo || !parsedData.contactInfo.name) {
      return NextResponse.json(
        { error: 'Could not extract contact information from resume' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
      fileName: file.name,
      fileType: isPdfFile(file) ? 'pdf' : 'text',
    });
  } catch (error: any) {
    console.error('Resume file parsing error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to parse resume file' },
      { status: 500 }
    );
  }
}
