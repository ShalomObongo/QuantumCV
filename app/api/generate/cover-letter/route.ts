import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai/provider';
import { buildCoverLetterPrompt } from '@/lib/gemini/prompts';
import {
  generateCoverLetterPDF,
  cleanCoverLetterContent,
} from '@/lib/pdf/cover-letter-generator';
import { createDocument } from '@/lib/firebase/db-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeText, jobDescription, userId, resumeData } = body;

    if (!resumeText || !jobDescription || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate cover letter content using AI (with automatic fallback)
    const aiProvider = getAIProvider();
    const prompt = buildCoverLetterPrompt(resumeText, jobDescription);
    const result = await aiProvider.generateContent(prompt);
    const rawContent = result.text;
    const cleanedContent = cleanCoverLetterContent(rawContent);

    // Generate PDF
    const pdfBuffer = await generateCoverLetterPDF(cleanedContent);

    // Create document record in Firestore
    const fileName = `cover_letter_${Date.now()}.pdf`;

    const documentId = await createDocument({
      userId,
      type: 'cover_letter',
      variant: 'tailored',
      data: resumeData || { contactInfo: {}, summary: '', experience: [], education: [], projects: [], skills: { technical: [], soft: [] }, achievements: [], certifications: [], languages: [], interests: [] },
      fileName,
      jobDescription,
    });

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
    return NextResponse.json(
      { error: error.message || 'Failed to generate cover letter' },
      { status: 500 }
    );
  }
}
