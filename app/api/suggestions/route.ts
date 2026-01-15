import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider, cleanAIResponse } from '@/lib/ai/provider';
import { ContentSuggestion } from '@/types';
import { AuthError, requireAuth } from '@/lib/firebase/server-auth';
import { parseJsonFromText } from '@/lib/ai/json';
import { buildRateLimitHeaders, rateLimit } from '@/lib/server/rate-limit';
import { enforceMaxBodySize, RequestSizeError } from '@/lib/server/request-size';
import { z } from 'zod';

const suggestionsSchema = z.object({
  content: z.string().min(1),
  contentType: z.enum(['summary', 'experience', 'skills', 'general']),
  jobDescription: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);

    const limit = rateLimit(`${uid}:suggestions`, { limit: 20, windowMs: 60_000 });
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait and try again.' },
        { status: 429, headers: buildRateLimitHeaders(limit) }
      );
    }

    enforceMaxBodySize(request, 256 * 1024);

    const body = await request.json();
    const parsed = suggestionsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { content, contentType, jobDescription } = parsed.data;

    // Build suggestion prompt based on content type
    const prompt = buildSuggestionPrompt(content, contentType, jobDescription);

    // Use AI to generate suggestions (with automatic fallback)
    const aiProvider = getAIProvider();
    const result = await aiProvider.generateContent(prompt);
    const cleanedResponse = cleanAIResponse(result.text);

    let suggestions: ContentSuggestion[];
    try {
      const parsed = parseJsonFromText<any>(cleanedResponse);
      suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions || [];
    } catch (error) {
      console.error('Failed to parse suggestions:', error);
      return NextResponse.json(
        { error: 'Failed to generate suggestions' },
        { status: 500 }
      );
    }

    // Validate and limit suggestions
    suggestions = suggestions
      .filter((s) => s.suggestedText && s.reason && s.type && s.impact)
      .slice(0, 5); // Max 5 suggestions

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error: any) {
    console.error('Suggestions error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof RequestSizeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

function buildSuggestionPrompt(
  content: string,
  contentType: string,
  jobDescription?: string
): string {
  const baseInstructions = `You are an expert resume writer and career coach. Analyze the following ${contentType} section and provide actionable suggestions to improve it.

IMPORTANT: Return ONLY a JSON array, no markdown formatting, no explanation text.

Each suggestion must follow this structure:
{
  "id": "unique_id",
  "type": "improvement" | "addition" | "keyword" | "rephrasing",
  "suggestedText": "the improved or additional text",
  "reason": "brief explanation of why this suggestion helps",
  "impact": "high" | "medium" | "low"
}

Guidelines:
1. Focus on actionable, specific improvements
2. Prioritize impact and relevance
3. Consider ATS optimization (keywords, formatting)
4. Make suggestions concise and clear
5. Return 3-5 suggestions maximum
6. For "improvement" type: suggest better wording for existing content
7. For "addition" type: suggest new content to add
8. For "keyword" type: suggest important keywords to include
9. For "rephrasing" type: suggest alternative phrasing for clarity/impact`;

  let specificInstructions = '';

  switch (contentType) {
    case 'summary':
      specificInstructions = `
Professional Summary Best Practices:
- Should be 2-3 sentences
- Highlight key achievements and years of experience
- Include relevant skills and industry focus
- Use strong action words
- Be specific about value proposition
- Avoid generic phrases like "hard worker" or "team player"`;
      break;

    case 'experience':
      specificInstructions = `
Experience Section Best Practices:
- Start bullet points with strong action verbs
- Include quantifiable metrics (numbers, percentages, $)
- Focus on achievements, not just responsibilities
- Use STAR method (Situation, Task, Action, Result)
- Be specific about impact and results
- Avoid weak phrases like "responsible for" or "helped with"
- Tailor to show relevant skills`;
      break;

    case 'skills':
      specificInstructions = `
Skills Section Best Practices:
- Separate technical and soft skills
- Include relevant technologies and tools
- Match job description keywords
- Be specific (e.g., "Python 3.x" instead of "Python")
- Include proficiency levels where appropriate
- Focus on in-demand skills
- Avoid listing outdated technologies`;
      break;

    default:
      specificInstructions = `
General Resume Best Practices:
- Use clear, concise language
- Include quantifiable achievements
- Optimize for ATS systems
- Match job description keywords
- Use industry-standard terminology
- Maintain consistent formatting
- Focus on recent and relevant information`;
  }

  const jobContext = jobDescription
    ? `\n\nJob Description Context:\n${jobDescription}\n\nTailor suggestions to align with this job description.`
    : '';

  return `${baseInstructions}

${specificInstructions}
${jobContext}

Content to Analyze:
${content}

Return the JSON array of suggestions:`;
}
