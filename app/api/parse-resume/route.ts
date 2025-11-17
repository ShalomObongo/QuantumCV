import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel, cleanAIResponse } from '@/lib/gemini/client';
import { ResumeData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeText } = body;

    if (!resumeText || typeof resumeText !== 'string') {
      return NextResponse.json(
        { error: 'Resume text is required' },
        { status: 400 }
      );
    }

    // Build parsing prompt
    const prompt = buildParsingPrompt(resumeText);

    // Use Gemini AI to parse the resume
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const cleanedResponse = cleanAIResponse(result.response.text());

    let parsedData: ResumeData;
    try {
      parsedData = JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return NextResponse.json(
        { error: 'Failed to parse resume data. Please check the format and try again.' },
        { status: 500 }
      );
    }

    // Validate parsed data has required fields
    if (!parsedData.contactInfo || !parsedData.contactInfo.name) {
      return NextResponse.json(
        { error: 'Could not extract contact information from resume' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Resume parsing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse resume' },
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
