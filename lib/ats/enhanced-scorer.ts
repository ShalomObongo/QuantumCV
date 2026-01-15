import { ResumeData, ATSScore } from '@/types';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Enhanced ATS Scoring System
 * Analyzes both structured resume data and raw PDF content
 */

export interface EnhancedATSScore extends ATSScore {
  pdfAnalysis?: {
    wordCount: number;
    hasContactInfo: boolean;
    hasProperFormatting: boolean;
    readabilityScore: number;
    sectionsFound: string[];
  };
  detailedRecommendations: {
    category: string;
    issue: string;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
  }[];
}

/**
 * Parse PDF buffer and extract text
 */
let pdfWorkerConfigured = false;

function resolvePdfJsWorkerUrl(): string | undefined {
  // Turbopack may rewrite `require.resolve(...)` to virtual module IDs (e.g. "[project] ... [app-route]"),
  // which are not importable by Node at runtime. Prefer a real filesystem path based on `process.cwd()`.
  const root = process.cwd();
  const candidates = [
    path.join(root, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs'),
    path.join(root, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.mjs'),
    path.join(root, 'node_modules', 'pdf-parse', 'dist', 'worker', 'pdf.worker.mjs'),
  ];

  for (const workerPath of candidates) {
    if (fs.existsSync(workerPath)) {
      return pathToFileURL(workerPath).href;
    }
  }
  return undefined;
}

export async function parsePDFContent(pdfBuffer: Buffer): Promise<string> {
  try {
    const mod = await import('pdf-parse');

    // pdf-parse v2+ exposes a PDFParse class (not a callable default function).
    const PDFParseCtor = (mod as any).PDFParse || (mod as any).default?.PDFParse;
    if (typeof PDFParseCtor === 'function') {
      // In Next.js dev (Turbopack), pdfjs can fail to resolve a bundled worker chunk.
      // Configure an explicit workerSrc to a real file (or data URL) before parsing.
      if (!pdfWorkerConfigured && typeof (PDFParseCtor as any).setWorker === 'function') {
        try {
          // Avoid importing `pdf-parse/worker` in Next/Turbopack builds (pulls in @napi-rs/canvas).
          // Use a real filesystem path to pdfjs-dist's worker instead.
          const workerUrl = resolvePdfJsWorkerUrl();
          if (workerUrl) {
            (PDFParseCtor as any).setWorker(workerUrl);
          }
          pdfWorkerConfigured = true;
        } catch {
          // If worker setup fails, we'll still try to parse; pdf.js will throw if it truly needs a worker.
        }
      }

      const parser = new PDFParseCtor({ data: pdfBuffer });
      try {
        const result = await parser.getText();
        return result?.text ?? '';
      } finally {
        if (typeof parser.destroy === 'function') {
          await parser.destroy();
        }
      }
    }

    // Backwards-compat for older pdf-parse versions that export a callable function.
    const maybeFn = (mod as any).default ?? mod;
    if (typeof maybeFn === 'function') {
      const result = await maybeFn(pdfBuffer);
      return result?.text ?? '';
    }

    throw new TypeError(
      `Unsupported pdf-parse export shape (keys: ${Object.keys(mod).join(', ')})`
    );
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF content');
  }
}

/**
 * Analyze PDF formatting and structure
 */
function analyzePDFContent(pdfText: string): EnhancedATSScore['pdfAnalysis'] {
  const words = pdfText.trim().split(/\s+/);
  const wordCount = words.length;

  // Check for contact information
  const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(pdfText);
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(pdfText);
  const hasContactInfo = hasEmail && hasPhone;

  // Check for proper formatting (consistent spacing, no excessive line breaks)
  const lineBreaks = (pdfText.match(/\n/g) || []).length;
  const hasProperFormatting = lineBreaks < wordCount * 0.5; // Not too many line breaks

  // Calculate readability score (based on average word length and sentence structure)
  const avgWordLength = pdfText.replace(/\s/g, '').length / wordCount;
  const sentences = pdfText.split(/[.!?]+/).length;
  const avgWordsPerSentence = wordCount / sentences;
  const readabilityScore = Math.min(100, Math.max(0,
    100 - Math.abs(avgWordLength - 5) * 10 - Math.abs(avgWordsPerSentence - 15) * 2
  ));

  // Detect sections
  const sectionsFound: string[] = [];
  const commonSections = [
    { name: 'Summary/Objective', patterns: ['summary', 'objective', 'profile'] },
    { name: 'Experience', patterns: ['experience', 'employment', 'work history'] },
    { name: 'Education', patterns: ['education', 'academic', 'degree'] },
    { name: 'Skills', patterns: ['skills', 'competencies', 'expertise'] },
    { name: 'Projects', patterns: ['projects', 'portfolio'] },
    { name: 'Certifications', patterns: ['certifications', 'certificates', 'licenses'] },
  ];

  const lowerText = pdfText.toLowerCase();
  commonSections.forEach(section => {
    if (section.patterns.some(pattern => lowerText.includes(pattern))) {
      sectionsFound.push(section.name);
    }
  });

  return {
    wordCount,
    hasContactInfo,
    hasProperFormatting,
    readabilityScore: Math.round(readabilityScore),
    sectionsFound,
  };
}

/**
 * Calculate enhanced ATS score with PDF analysis
 */
export async function calculateEnhancedATSScore(
  resumeData: ResumeData,
  jobDescription?: string,
  pdfBuffer?: Buffer
): Promise<EnhancedATSScore> {
  // Start with basic scoring
  const scores: any = {
    keywords: 0,
    formatting: 0,
    structure: 0,
    skills: 0,
    experience: 0,
  };

  const issues: string[] = [];
  const recommendations: EnhancedATSScore['detailedRecommendations'] = [];

  // 1. Keywords Analysis (25 points)
  if (jobDescription) {
    const jobKeywords = extractKeywords(jobDescription);
    const resumeText = JSON.stringify(resumeData).toLowerCase();
    const matchedKeywords = jobKeywords.filter(keyword =>
      resumeText.includes(keyword.toLowerCase())
    );
    const keywordScore = (matchedKeywords.length / Math.max(jobKeywords.length, 1)) * 25;
    scores.keywords = Math.round(keywordScore);

    if (scores.keywords < 15) {
      issues.push('Low keyword match with job description');
      recommendations.push({
        category: 'Keywords',
        issue: `Only ${matchedKeywords.length}/${jobKeywords.length} key terms found`,
        suggestion: `Add more relevant keywords: ${jobKeywords.slice(0, 5).join(', ')}`,
        priority: 'high',
      });
    }
  } else {
    scores.keywords = 20; // Default score without job description
  }

  // 2. Formatting Analysis (20 points)
  let formattingScore = 20;
  if (!resumeData.contactInfo?.name) {
    formattingScore -= 5;
    issues.push('Missing contact name');
    recommendations.push({
      category: 'Contact Info',
      issue: 'Name is missing',
      suggestion: 'Add your full name to the contact information',
      priority: 'high',
    });
  }
  if (!resumeData.contactInfo?.email) {
    formattingScore -= 5;
    issues.push('Missing email address');
    recommendations.push({
      category: 'Contact Info',
      issue: 'Email is missing',
      suggestion: 'Include a professional email address',
      priority: 'high',
    });
  }
  if (!resumeData.contactInfo?.phone) {
    formattingScore -= 3;
    issues.push('Missing phone number');
    recommendations.push({
      category: 'Contact Info',
      issue: 'Phone number is missing',
      suggestion: 'Add your phone number for easy contact',
      priority: 'medium',
    });
  }
  scores.formatting = Math.max(0, formattingScore);

  // 3. Structure Analysis (20 points)
  let structureScore = 0;
  if (resumeData.summary && resumeData.summary.length > 50) {
    structureScore += 5;
  } else {
    recommendations.push({
      category: 'Summary',
      issue: 'Professional summary is missing or too short',
      suggestion: 'Add a compelling 2-3 sentence professional summary highlighting your key strengths',
      priority: 'high',
    });
  }

  if (resumeData.experience && resumeData.experience.length > 0) {
    structureScore += 7;
    if (resumeData.experience.length >= 3) structureScore += 3;
  } else {
    recommendations.push({
      category: 'Experience',
      issue: 'No work experience listed',
      suggestion: 'Add your professional work experience with specific achievements',
      priority: 'high',
    });
  }

  if (resumeData.education && resumeData.education.length > 0) {
    structureScore += 5;
  } else {
    recommendations.push({
      category: 'Education',
      issue: 'Education section is missing',
      suggestion: 'Include your educational background',
      priority: 'medium',
    });
  }
  scores.structure = Math.min(20, structureScore);

  // 4. Skills Analysis (20 points)
  const totalSkills = (resumeData.skills?.technical?.length || 0) +
    (resumeData.skills?.soft?.length || 0);

  if (totalSkills >= 10) {
    scores.skills = 20;
  } else if (totalSkills >= 5) {
    scores.skills = 15;
    recommendations.push({
      category: 'Skills',
      issue: 'Limited skills listed',
      suggestion: 'Add more relevant technical and soft skills (aim for 10-15 total)',
      priority: 'medium',
    });
  } else {
    scores.skills = 10;
    recommendations.push({
      category: 'Skills',
      issue: 'Very few skills listed',
      suggestion: 'Expand your skills section with both technical and soft skills relevant to your field',
      priority: 'high',
    });
  }

  // 5. Experience Quality Analysis (15 points)
  let experienceScore = 0;
  if (resumeData.experience && resumeData.experience.length > 0) {
    const hasQuantifiableAchievements = resumeData.experience.some(exp =>
      exp.points?.some(point => /\d+/.test(point)) ||
      exp.achievements?.some(ach => /\d+|%|\$/.test(ach))
    );

    if (hasQuantifiableAchievements) {
      experienceScore += 10;
    } else {
      recommendations.push({
        category: 'Experience',
        issue: 'Experience lacks quantifiable achievements',
        suggestion: 'Add specific numbers, percentages, or metrics to demonstrate impact (e.g., "Increased sales by 30%")',
        priority: 'high',
      });
      experienceScore += 5;
    }

    const avgPoints = resumeData.experience.reduce((sum, exp) =>
      sum + (exp.points?.length || 0), 0) / resumeData.experience.length;

    if (avgPoints >= 3) {
      experienceScore += 5;
    } else {
      recommendations.push({
        category: 'Experience',
        issue: 'Experience descriptions are too brief',
        suggestion: 'Add 3-5 bullet points per role highlighting key responsibilities and achievements',
        priority: 'medium',
      });
    }
  }
  scores.experience = experienceScore;

  // Analyze PDF if provided
  let pdfAnalysis: EnhancedATSScore['pdfAnalysis'] | undefined;
  if (pdfBuffer) {
    try {
      const pdfText = await parsePDFContent(pdfBuffer);
      pdfAnalysis = analyzePDFContent(pdfText);

      // Adjust scores based on PDF analysis
      if (pdfAnalysis && !pdfAnalysis.hasContactInfo) {
        scores.formatting = Math.max(0, scores.formatting - 5);
        recommendations.push({
          category: 'PDF Formatting',
          issue: 'Contact information not clearly visible in PDF',
          suggestion: 'Ensure your contact details are prominently displayed at the top of your resume',
          priority: 'high',
        });
      }

      if (pdfAnalysis && pdfAnalysis.readabilityScore < 60) {
        scores.formatting = Math.max(0, scores.formatting - 3);
        recommendations.push({
          category: 'Readability',
          issue: 'Resume may be difficult to read',
          suggestion: 'Use clear formatting with appropriate spacing and avoid overly complex sentences',
          priority: 'medium',
        });
      }

      if (pdfAnalysis && pdfAnalysis.wordCount < 200) {
        recommendations.push({
          category: 'Content Length',
          issue: 'Resume is too short',
          suggestion: 'Expand your resume with more details about your experience and skills (aim for 300-500 words)',
          priority: 'high',
        });
      } else if (pdfAnalysis && pdfAnalysis.wordCount > 800) {
        recommendations.push({
          category: 'Content Length',
          issue: 'Resume is too long',
          suggestion: 'Condense your resume to focus on the most relevant and impactful information',
          priority: 'medium',
        });
      }
    } catch (error) {
      console.error('PDF analysis failed:', error);
    }
  }

  // Calculate overall score
  const overall = Math.round(
    scores.keywords + scores.formatting + scores.structure +
    scores.skills + scores.experience
  );

  // Convert issues to ATSIssue format
  const atsIssues = issues.map(issue => ({
    severity: 'warning' as const,
    category: 'content' as const,
    message: issue,
    suggestion: 'See detailed recommendations for fixes',
  }));

  return {
    overall: Math.min(100, Math.max(0, overall)),
    breakdown: scores,
    issues: atsIssues,
    recommendations: issues,
    matchedKeywords: jobDescription ? extractKeywords(jobDescription).slice(0, 10) : [],
    missingKeywords: [],
    lastAnalyzed: new Date(),
    pdfAnalysis,
    detailedRecommendations: recommendations,
  };
}

/**
 * Extract keywords from job description
 */
function extractKeywords(text: string): string[] {
  const commonWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
    'is', 'are', 'was', 'were', 'been', 'has', 'had', 'having',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));

  // Count frequency
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Sort by frequency and return top keywords
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}
