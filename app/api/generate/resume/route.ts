import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel, cleanAIResponse } from '@/lib/gemini/client';
import { buildResumePrompt } from '@/lib/gemini/prompts';
import { generateResumePDF } from '@/lib/pdf/resume-generator';
import { createDocument } from '@/lib/firebase/db-utils';
import { ResumeData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeText, jobDescription, isTailored, userId } = body;

    if (!resumeText || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate resume data using AI
    const model = getGeminiModel();
    const prompt = buildResumePrompt(resumeText, jobDescription, isTailored);
    const result = await model.generateContent(prompt);
    const cleanedResponse = cleanAIResponse(result.response.text());

    let resumeData: ResumeData;
    try {
      resumeData = JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return NextResponse.json(
        { error: 'Failed to generate resume data' },
        { status: 500 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateResumePDF(resumeData);

    // Create document record in Firestore
    const variant = isTailored ? 'tailored' : 'general';
    const fileName = `resume_${variant}_${Date.now()}.pdf`;

    const documentId = await createDocument({
      userId,
      type: 'resume',
      variant,
      data: resumeData,
      fileName,
      jobDescription: jobDescription || undefined,
    });

    // Return PDF as base64 for download
    const pdfBase64 = pdfBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      documentId,
      resumeData,
      pdf: pdfBase64,
      fileName,
    });
  } catch (error: any) {
    console.error('Resume generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate resume' },
      { status: 500 }
    );
  }
}
