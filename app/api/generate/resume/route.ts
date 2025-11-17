import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider, cleanAIResponse } from '@/lib/ai/provider';
import { buildResumePrompt } from '@/lib/gemini/prompts';
import { generateResumePDF } from '@/lib/pdf/resume-generator';
import { generateTemplatedResumePDF } from '@/lib/pdf/template-renderer';
import { createDocument } from '@/lib/firebase/db-utils';
import { calculateATSScore } from '@/lib/ats/scoring';
import { ResumeData, TemplateId } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeText, jobDescription, isTailored, userId, templateId } = body;

    if (!resumeText || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use templateId if provided, otherwise default to 'modern'
    const selectedTemplate: TemplateId = templateId || 'modern';

    // Generate resume data using AI (with automatic fallback)
    const aiProvider = getAIProvider();
    const prompt = buildResumePrompt(resumeText, jobDescription, isTailored);
    const result = await aiProvider.generateContent(prompt);
    const cleanedResponse = cleanAIResponse(result.text);

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

    // Calculate ATS score
    const atsScore = calculateATSScore(resumeData, jobDescription);

    // Generate PDF using selected template
    const pdfBuffer = await generateTemplatedResumePDF(resumeData, selectedTemplate);

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
      templateId: selectedTemplate,
      atsScore,
    });

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
    return NextResponse.json(
      { error: error.message || 'Failed to generate resume' },
      { status: 500 }
    );
  }
}
