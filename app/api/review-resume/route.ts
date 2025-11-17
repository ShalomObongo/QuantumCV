import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider, cleanAIResponse } from '@/lib/ai/provider';
import { calculateEnhancedATSScore, parsePDFContent } from '@/lib/ats/enhanced-scorer';
import { generateAIReview } from '@/lib/ai/review';
import { ResumeData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get('pdf') as File;
    const jobDescription = formData.get('jobDescription') as string | null;
    const userId = formData.get('userId') as string;

    if (!pdfFile) {
      return NextResponse.json(
        { error: 'PDF file is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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
    const parsePrompt = buildParsingPrompt(pdfText);
    const parseResult = await aiProvider.generateContent(parsePrompt);
    const cleanedResponse = cleanAIResponse(parseResult.text);

    let resumeData: ResumeData;
    try {
      resumeData = JSON.parse(cleanedResponse);
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
    return NextResponse.json(
      { error: error.message || 'Failed to review resume' },
      { status: 500 }
    );
  }
}

function buildParsingPrompt(resumeText: string): string {
  return `You are an expert resume parser. Extract structured information from the following resume text and return it as a JSON object.

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no explanation text.

The JSON structure must exactly match this TypeScript interface:

{
  "contactInfo": {
    "name": string,
    "email": string,
    "phone": string,
    "location": string,
    "socialLinks": [
      {
        "platform": string,
        "url": string
      }
    ]
  },
  "summary": string,
  "experience": [
    {
      "company": string,
      "title": string,
      "date": string,
      "location": string,
      "industry": string,
      "points": [string],
      "achievements": [string]
    }
  ],
  "education": [
    {
      "school": string,
      "degree": string,
      "date": string,
      "location": string,
      "details": string,
      "grade": string
    }
  ],
  "projects": [
    {
      "name": string,
      "description": string,
      "technologies": [string],
      "role": string,
      "link": string
    }
  ],
  "skills": {
    "technical": [string],
    "soft": [string]
  },
  "achievements": [string],
  "certifications": [
    {
      "name": string,
      "issuer": string,
      "date": string
    }
  ],
  "languages": [
    {
      "language": string,
      "level": string
    }
  ],
  "interests": [string]
}

Guidelines:
1. Extract all information present in the resume
2. For missing fields, use empty strings "" or empty arrays []
3. Normalize dates to format like "Jan 2020 - Dec 2022" or "2020-2022"
4. For experience points, extract bullet points describing responsibilities and achievements
5. Separate technical skills (programming languages, tools, frameworks) from soft skills (leadership, communication)
6. Extract social links from URLs (LinkedIn, GitHub, portfolio, etc.)
7. If a summary/objective is present, extract it. If not, leave summary as empty string
8. For achievements, extract notable accomplishments, awards, or recognitions
9. Industry should be a general category like "Technology", "Healthcare", "Finance", etc.
10. Ensure all string values are properly escaped for JSON

Resume Text:
${resumeText}

Return the JSON data:`;
}
