import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider, cleanAIResponse } from '@/lib/ai/provider';
import { buildResumePrompt } from '@/lib/gemini/prompts';
import { generateResumePDF } from '@/lib/pdf/resume-generator';
import { generateTemplatedResumePDF } from '@/lib/pdf/template-renderer';
import { renderCustomTemplate } from '@/lib/pdf/custom-template-renderer';
import { createDocument, getUserCustomTemplates, CustomTemplate } from '@/lib/firebase/db-utils';
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

    // Generate PDF using selected template (built-in or custom)
    let pdfBuffer: Buffer;
    let isCustomTemplate = false;

    if (selectedTemplate.startsWith('custom-')) {
      // Custom template - fetch and render
      isCustomTemplate = true;
      const customTemplateId = selectedTemplate.replace('custom-', '');

      // Fetch user's custom templates
      const customTemplates = await getUserCustomTemplates(userId);
      const customTemplate = customTemplates.find((t) => t.id === customTemplateId);

      if (!customTemplate) {
        return NextResponse.json(
          { error: 'Custom template not found' },
          { status: 404 }
        );
      }

      pdfBuffer = await renderCustomTemplate(resumeData, customTemplate);
    } else {
      // Built-in template
      pdfBuffer = await generateTemplatedResumePDF(resumeData, selectedTemplate);
    }

    // Create document record in Firestore
    const variant = isTailored ? 'tailored' : 'general';
    const fileName = `resume_${variant}_${Date.now()}.pdf`;

    const documentData: any = {
      userId,
      type: 'resume',
      variant,
      data: resumeData,
      fileName,
      templateId: selectedTemplate,
      atsScore,
    };

    // Only include jobDescription if it exists (Firestore doesn't allow undefined)
    if (jobDescription) {
      documentData.jobDescription = jobDescription;
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
    return NextResponse.json(
      { error: error.message || 'Failed to generate resume' },
      { status: 500 }
    );
  }
}
