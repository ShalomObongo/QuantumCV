import { NextRequest, NextResponse } from 'next/server';
import { applyAcceptedSuggestions } from '@/lib/ai/review';
import { ResumeData } from '@/types';
import { ReviewSuggestion } from '@/lib/ai/review';
import { AuthError, requireAuth } from '@/lib/firebase/server-auth';
import { buildRateLimitHeaders, rateLimit } from '@/lib/server/rate-limit';
import { enforceMaxBodySize, RequestSizeError } from '@/lib/server/request-size';
import { z } from 'zod';

const applySuggestionsSchema = z.object({
  resumeData: z.unknown(),
  acceptedSuggestions: z.array(z.unknown()),
  jobDescription: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);

    const limit = rateLimit(`${uid}:apply-suggestions`, { limit: 5, windowMs: 60_000 });
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait and try again.' },
        { status: 429, headers: buildRateLimitHeaders(limit) }
      );
    }

    enforceMaxBodySize(request, 512 * 1024);

    const body = await request.json();
    const parsed = applySuggestionsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { resumeData, acceptedSuggestions, jobDescription } = parsed.data;

    if (!resumeData) {
      return NextResponse.json(
        { error: 'Resume data is required' },
        { status: 400 }
      );
    }

    if (!acceptedSuggestions || !Array.isArray(acceptedSuggestions)) {
      return NextResponse.json(
        { error: 'Accepted suggestions array is required' },
        { status: 400 }
      );
    }

    // Apply suggestions to resume data
    const updatedResumeData: ResumeData = await applyAcceptedSuggestions(
      resumeData as ResumeData,
      acceptedSuggestions as ReviewSuggestion[],
      jobDescription
    );

    return NextResponse.json({
      success: true,
      resumeData: updatedResumeData,
    });
  } catch (error: any) {
    console.error('Apply suggestions error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof RequestSizeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to apply suggestions' },
      { status: 500 }
    );
  }
}
