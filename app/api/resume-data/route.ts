import { NextRequest, NextResponse } from 'next/server';
import { saveResumeData, getUserResumeData } from '@/lib/firebase/db-utils';
import { AuthError, requireAuth } from '@/lib/firebase/server-auth';

export async function GET(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);
    const resumeData = await getUserResumeData(uid);
    return NextResponse.json({ success: true, resumeData });
  } catch (error: any) {
    console.error('Error fetching resume data:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to fetch resume data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);
    const body = await request.json();
    const { resumeData } = body;

    if (!resumeData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await saveResumeData(uid, resumeData);
    return NextResponse.json({
      success: true,
      message: 'Resume data saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving resume data:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to save resume data' },
      { status: 500 }
    );
  }
}
