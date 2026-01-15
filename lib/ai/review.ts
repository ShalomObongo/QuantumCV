import { getAIProvider, cleanAIResponse } from './provider';
import { ResumeData } from '@/types';
import { EnhancedATSScore } from '../ats/enhanced-scorer';
import { parseJsonFromText } from './json';

/**
 * AI Review System
 * Provides detailed suggestions for resume improvement
 */

export interface ReviewSuggestion {
  id: string;
  category: 'content' | 'formatting' | 'keywords' | 'structure' | 'impact';
  section: string; // Which section of resume (e.g., 'experience', 'summary', 'skills')
  issue: string;
  suggestion: string;
  example?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface AIReviewResult {
  overallAssessment: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: ReviewSuggestion[];
  scoreImpact: {
    currentScore: number;
    potentialScore: number;
    improvementAreas: string[];
  };
}

/**
 * Generate AI-powered resume review
 */
export async function generateAIReview(
  resumeData: ResumeData,
  atsScore: EnhancedATSScore,
  jobDescription?: string
): Promise<AIReviewResult> {
  const aiProvider = getAIProvider();

  const prompt = buildReviewPrompt(resumeData, atsScore, jobDescription);
  const result = await aiProvider.generateContent(prompt);
  const cleanedResponse = cleanAIResponse(result.text);

  try {
    const parsedReview = parseJsonFromText<AIReviewResult>(cleanedResponse);
    return parsedReview;
  } catch (error) {
    console.error('Failed to parse AI review:', error);
    throw new Error('Failed to generate AI review');
  }
}

/**
 * Apply accepted suggestions to resume data
 */
export async function applyAcceptedSuggestions(
  resumeData: ResumeData,
  acceptedSuggestions: ReviewSuggestion[],
  jobDescription?: string
): Promise<ResumeData> {
  const aiProvider = getAIProvider();

  const prompt = buildApplyPrompt(resumeData, acceptedSuggestions, jobDescription);
  const result = await aiProvider.generateContent(prompt);
  const cleanedResponse = cleanAIResponse(result.text);

  try {
    const updatedResumeData = parseJsonFromText<ResumeData>(cleanedResponse);
    return updatedResumeData;
  } catch (error) {
    console.error('Failed to apply suggestions:', error);
    throw new Error('Failed to apply suggestions to resume');
  }
}

/**
 * Build prompt for AI review
 */
function buildReviewPrompt(
  resumeData: ResumeData,
  atsScore: EnhancedATSScore,
  jobDescription?: string
): string {
  return `You are an expert resume reviewer and career coach with 15+ years of experience. Analyze this resume and provide detailed, actionable feedback.

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no explanatory text.

Resume Data:
${JSON.stringify(resumeData, null, 2)}

Current ATS Score: ${atsScore.overall}/100
Score Breakdown:
- Keywords: ${atsScore.breakdown.keywords}/25
- Formatting: ${atsScore.breakdown.formatting}/20
- Structure: ${atsScore.breakdown.structure}/20
- Skills: ${atsScore.breakdown.skills}/20
- Experience: ${atsScore.breakdown.experience}/15

${jobDescription ? `Job Description:\n${jobDescription}\n` : 'No job description provided - provide general resume improvements.'}

${atsScore.pdfAnalysis ? `PDF Analysis:
- Word Count: ${atsScore.pdfAnalysis.wordCount}
- Readability Score: ${atsScore.pdfAnalysis.readabilityScore}/100
- Sections Found: ${atsScore.pdfAnalysis.sectionsFound.join(', ')}
` : ''}

Your task:
1. Identify 3-5 key strengths of this resume
2. Identify 3-5 key weaknesses
3. Provide 8-12 specific, actionable suggestions for improvement
4. Estimate potential ATS score after improvements

Focus on:
- Keyword optimization ${jobDescription ? 'for the provided job description' : ''}
- Quantifiable achievements (numbers, percentages, dollar amounts)
- Strong action verbs
- ATS-friendly formatting
- Impact and results
- Professional summary optimization
- Skills alignment ${jobDescription ? 'with job requirements' : ''}

Return JSON in this exact structure:
{
  "overallAssessment": "2-3 sentence summary of the resume quality and main areas for improvement",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "suggestions": [
    {
      "id": "unique_id_1",
      "category": "content|formatting|keywords|structure|impact",
      "section": "experience|summary|skills|education|etc",
      "issue": "Clear description of the issue",
      "suggestion": "Specific action to take",
      "example": "Optional example of improved text",
      "priority": "critical|high|medium|low",
      "reasoning": "Why this change matters for ATS and hiring managers"
    }
  ],
  "scoreImpact": {
    "currentScore": ${atsScore.overall},
    "potentialScore": 85-95,
    "improvementAreas": ["area 1", "area 2", "area 3"]
  }
}

Guidelines for suggestions:
1. Be specific - don't just say "improve experience", explain exactly what to change
2. Provide examples when possible
3. Prioritize based on impact: critical > high > medium > low
4. Focus on changes that will increase ATS score and human appeal
5. ${jobDescription ? 'Align suggestions with job description requirements' : 'Provide general best practices'}
6. Include at least 2-3 suggestions per major category (content, keywords, structure)

Return the JSON now:`;
}

/**
 * Build prompt for applying suggestions
 */
function buildApplyPrompt(
  resumeData: ResumeData,
  acceptedSuggestions: ReviewSuggestion[],
  jobDescription?: string
): string {
  return `You are a professional resume writer. Apply the following accepted suggestions to improve this resume.

IMPORTANT: Return ONLY valid JSON matching the ResumeData structure, no markdown, no explanatory text.

Current Resume Data:
${JSON.stringify(resumeData, null, 2)}

Accepted Suggestions to Apply:
${JSON.stringify(acceptedSuggestions, null, 2)}

${jobDescription ? `Job Description for context:\n${jobDescription}\n` : ''}

Instructions:
1. Apply each accepted suggestion to the appropriate section of the resume
2. Maintain the exact JSON structure of the ResumeData type
3. Preserve all existing data not affected by suggestions
4. When adding quantifiable metrics, make them realistic and consistent with the role
5. Ensure all text improvements maintain professional tone
6. Keep formatting ATS-friendly (no special characters, clear structure)
7. ${jobDescription ? 'Optimize for the job description keywords and requirements' : ''}

Return the complete updated ResumeData as JSON:

{
  "contactInfo": { ... },
  "summary": "...",
  "experience": [ ... ],
  "education": [ ... ],
  "projects": [ ... ],
  "skills": { "technical": [...], "soft": [...] },
  "achievements": [ ... ],
  "certifications": [ ... ],
  "languages": [ ... ],
  "interests": [ ... ]
}

Apply the suggestions and return the complete updated resume data:`;
}

/**
 * Generate quick suggestions for specific section
 */
export async function generateSectionSuggestions(
  sectionName: string,
  sectionContent: any,
  jobDescription?: string
): Promise<ReviewSuggestion[]> {
  const aiProvider = getAIProvider();

  const prompt = `You are a resume expert. Provide 3-5 quick improvement suggestions for this resume section.

Section: ${sectionName}
Current Content:
${JSON.stringify(sectionContent, null, 2)}

${jobDescription ? `Job Description:\n${jobDescription}\n` : ''}

Return ONLY a JSON array of suggestions:
[
  {
    "id": "unique_id",
    "category": "content|formatting|keywords|structure|impact",
    "section": "${sectionName}",
    "issue": "what's wrong",
    "suggestion": "how to fix it",
    "example": "optional example",
    "priority": "critical|high|medium|low",
    "reasoning": "why this matters"
  }
]

Return the JSON array:`;

  const result = await aiProvider.generateContent(prompt);
  const cleanedResponse = cleanAIResponse(result.text);

  try {
    return parseJsonFromText<ReviewSuggestion[]>(cleanedResponse);
  } catch (error) {
    console.error('Failed to parse section suggestions:', error);
    return [];
  }
}
