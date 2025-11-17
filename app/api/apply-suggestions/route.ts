import { NextRequest, NextResponse } from 'next/server';
import { applyAcceptedSuggestions } from '@/lib/ai/review';
import { ResumeData } from '@/types';
import { ReviewSuggestion } from '@/lib/ai/review';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeData, acceptedSuggestions, jobDescription } = body;

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
      resumeData,
      acceptedSuggestions as ReviewSuggestion[],
      jobDescription
    );

    return NextResponse.json({
      success: true,
      resumeData: updatedResumeData,
    });
  } catch (error: any) {
    console.error('Apply suggestions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to apply suggestions' },
      { status: 500 }
    );
  }
}
