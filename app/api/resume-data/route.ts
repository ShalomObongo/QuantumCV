import { NextRequest, NextResponse } from 'next/server';
import { saveResumeData, getUserResumeData } from '@/lib/firebase/db-utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const resumeData = await getUserResumeData(userId);
    return NextResponse.json({ success: true, resumeData });
  } catch (error: any) {
    console.error('Error fetching resume data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch resume data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, resumeData } = body;

    if (!userId || !resumeData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await saveResumeData(userId, resumeData);
    return NextResponse.json({
      success: true,
      message: 'Resume data saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving resume data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save resume data' },
      { status: 500 }
    );
  }
}
