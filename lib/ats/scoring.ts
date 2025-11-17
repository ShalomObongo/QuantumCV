import { ResumeData, ATSScore, ATSIssue } from '@/types';

/**
 * Calculate ATS (Applicant Tracking System) score for a resume
 */
export function calculateATSScore(
  resumeData: ResumeData,
  jobDescription?: string
): ATSScore {
  const issues: ATSIssue[] = [];
  const recommendations: string[] = [];
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  // Extract keywords from job description if provided
  const jobKeywords = jobDescription
    ? extractKeywords(jobDescription)
    : [];

  // 1. Keyword Analysis (30%)
  const keywordScore = analyzeKeywords(
    resumeData,
    jobKeywords,
    matchedKeywords,
    missingKeywords,
    issues,
    recommendations
  );

  // 2. Formatting Analysis (20%)
  const formattingScore = analyzeFormatting(
    resumeData,
    issues,
    recommendations
  );

  // 3. Structure Analysis (20%)
  const structureScore = analyzeStructure(
    resumeData,
    issues,
    recommendations
  );

  // 4. Skills Analysis (15%)
  const skillsScore = analyzeSkills(
    resumeData,
    jobKeywords,
    issues,
    recommendations
  );

  // 5. Experience Analysis (15%)
  const experienceScore = analyzeExperience(
    resumeData,
    jobKeywords,
    issues,
    recommendations
  );

  // Calculate weighted overall score
  const overall = Math.round(
    keywordScore * 0.3 +
      formattingScore * 0.2 +
      structureScore * 0.2 +
      skillsScore * 0.15 +
      experienceScore * 0.15
  );

  return {
    overall,
    breakdown: {
      keywords: keywordScore,
      formatting: formattingScore,
      structure: structureScore,
      skills: skillsScore,
      experience: experienceScore,
    },
    issues,
    recommendations: recommendations.slice(0, 10), // Top 10 recommendations
    matchedKeywords: matchedKeywords.slice(0, 20), // Top 20 matched
    missingKeywords: missingKeywords.slice(0, 10), // Top 10 missing
    lastAnalyzed: new Date(),
  };
}

/**
 * Extract important keywords from job description
 */
function extractKeywords(text: string): string[] {
  // Common stop words to exclude
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'should', 'could', 'may', 'might', 'can', 'this', 'that', 'these',
    'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which',
    'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both',
    'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'our', 'your',
  ]);

  // Extract words (minimum 3 characters)
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !stopWords.has(word));

  // Count word frequency
  const wordFrequency = new Map<string, number>();
  words.forEach((word) => {
    wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
  });

  // Extract multi-word phrases (2-3 words)
  const phrases = extractPhrases(text);

  // Combine and sort by frequency/importance
  const allKeywords = [
    ...Array.from(wordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word),
    ...phrases,
  ];

  return Array.from(new Set(allKeywords)).slice(0, 50);
}

/**
 * Extract important phrases from text
 */
function extractPhrases(text: string): string[] {
  const phrases: string[] = [];
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  const words = normalized.split(/\s+/);

  // Extract 2-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`;
    if (
      words[i].length >= 3 &&
      words[i + 1].length >= 3 &&
      !phrase.match(/^\d+\s+\w+$/)
    ) {
      phrases.push(phrase);
    }
  }

  // Extract 3-word phrases
  for (let i = 0; i < words.length - 2; i++) {
    const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    if (
      words[i].length >= 3 &&
      words[i + 1].length >= 2 &&
      words[i + 2].length >= 3
    ) {
      phrases.push(phrase);
    }
  }

  return phrases;
}

/**
 * Analyze keyword matching
 */
function analyzeKeywords(
  resumeData: ResumeData,
  jobKeywords: string[],
  matchedKeywords: string[],
  missingKeywords: string[],
  issues: ATSIssue[],
  recommendations: string[]
): number {
  if (jobKeywords.length === 0) {
    // No job description provided, check for general keyword density
    const resumeText = JSON.stringify(resumeData).toLowerCase();
    const words = resumeText.split(/\s+/).length;
    const uniqueWords = new Set(resumeText.split(/\s+/)).size;
    const density = uniqueWords / words;

    if (density < 0.3) {
      issues.push({
        severity: 'warning',
        category: 'keywords',
        message: 'Resume may have repetitive content',
        suggestion: 'Consider using more varied vocabulary to improve readability',
      });
      return 70;
    }

    return 85;
  }

  // Convert resume to searchable text
  const resumeText = JSON.stringify(resumeData).toLowerCase();

  // Check for keyword matches
  let matchCount = 0;
  jobKeywords.forEach((keyword) => {
    if (resumeText.includes(keyword.toLowerCase())) {
      matchedKeywords.push(keyword);
      matchCount++;
    } else {
      missingKeywords.push(keyword);
    }
  });

  const matchRate = matchCount / jobKeywords.length;

  // Score based on match rate
  let score = Math.round(matchRate * 100);

  // Add issues and recommendations
  if (matchRate < 0.3) {
    issues.push({
      severity: 'critical',
      category: 'keywords',
      message: `Only ${Math.round(matchRate * 100)}% of job keywords found in resume`,
      suggestion: 'Incorporate more keywords from the job description into your experience and skills sections',
    });
    recommendations.push(
      'Incorporate more keywords from the job description into your experience and skills sections.'
    );
  } else if (matchRate < 0.5) {
    issues.push({
      severity: 'warning',
      category: 'keywords',
      message: 'Resume could better match job description keywords',
      suggestion: 'Review missing keywords and add relevant ones to your resume',
    });
    recommendations.push(
      'Review missing keywords and add relevant ones to your resume.'
    );
  } else if (matchRate >= 0.7) {
    recommendations.push(
      'Excellent keyword alignment with job description!'
    );
  }

  return Math.max(score, 30); // Minimum 30 points
}

/**
 * Analyze formatting quality
 */
function analyzeFormatting(
  resumeData: ResumeData,
  issues: ATSIssue[],
  recommendations: string[]
): number {
  let score = 100;

  // Check contact info completeness
  const contact = resumeData.contactInfo;
  if (!contact.email || !contact.email.includes('@')) {
    issues.push({
      severity: 'critical',
      category: 'formatting',
      message: 'Missing or invalid email address',
      suggestion: 'Add a valid email address to your contact information',
    });
    score -= 20;
  }

  if (!contact.phone || contact.phone.length < 10) {
    issues.push({
      severity: 'warning',
      category: 'formatting',
      message: 'Missing or incomplete phone number',
      suggestion: 'Add a complete phone number to your contact information',
    });
    score -= 10;
  }

  if (!contact.location) {
    issues.push({
      severity: 'info',
      category: 'formatting',
      message: 'Location information missing',
      suggestion: 'Consider adding your location (city, state)',
    });
    score -= 5;
  }

  // Check for consistent date formatting
  const dates = [
    ...resumeData.experience.map((exp) => exp.date),
    ...resumeData.education.map((edu) => edu.date),
  ];

  const hasInconsistentDates = dates.some((date) => {
    return !date || date.length < 4 || !date.match(/\d{4}/);
  });

  if (hasInconsistentDates) {
    issues.push({
      severity: 'info',
      category: 'formatting',
      message: 'Inconsistent date formatting detected',
      suggestion: 'Use consistent date format throughout (e.g., "Jan 2020 - Dec 2022")',
    });
    recommendations.push(
      'Use consistent date format throughout (e.g., "Jan 2020 - Dec 2022").'
    );
    score -= 5;
  }

  // Check for bullet points in experience
  const hasShortBullets = resumeData.experience.some((exp) =>
    exp.points.some((point) => point.length < 20)
  );

  if (hasShortBullets) {
    issues.push({
      severity: 'warning',
      category: 'formatting',
      message: 'Some experience bullets are too short',
      suggestion: 'Expand brief bullet points with more specific details and metrics',
    });
    recommendations.push(
      'Expand brief bullet points with more specific details and metrics.'
    );
    score -= 10;
  }

  return Math.max(score, 30);
}

/**
 * Analyze resume structure
 */
function analyzeStructure(
  resumeData: ResumeData,
  issues: ATSIssue[],
  recommendations: string[]
): number {
  let score = 100;

  // Check summary
  if (!resumeData.summary || resumeData.summary.length < 50) {
    issues.push({
      severity: 'warning',
      category: 'structure',
      message: 'Professional summary is missing or too short',
      suggestion: 'Add a compelling professional summary (2-3 sentences) at the top of your resume',
    });
    recommendations.push(
      'Add a compelling professional summary (2-3 sentences) at the top of your resume.'
    );
    score -= 15;
  } else if (resumeData.summary.length > 500) {
    issues.push({
      severity: 'info',
      category: 'structure',
      message: 'Professional summary is too long',
      suggestion: 'Shorten your professional summary to 2-3 concise sentences',
    });
    recommendations.push(
      'Shorten your professional summary to 2-3 concise sentences.'
    );
    score -= 5;
  }

  // Check experience section
  if (!resumeData.experience || resumeData.experience.length === 0) {
    issues.push({
      severity: 'critical',
      category: 'structure',
      message: 'No work experience listed',
      suggestion: 'Add your work experience with detailed descriptions',
    });
    score -= 30;
  } else {
    // Check for detailed experience entries
    const hasDetailedExperience = resumeData.experience.every(
      (exp) => exp.points.length >= 2 && exp.company && exp.title && exp.date
    );

    if (!hasDetailedExperience) {
      issues.push({
        severity: 'warning',
        category: 'structure',
        message: 'Some experience entries lack sufficient detail',
        suggestion: 'Ensure each position has at least 2-3 bullet points describing your responsibilities and achievements',
      });
      recommendations.push(
        'Ensure each position has at least 2-3 bullet points describing your responsibilities and achievements.'
      );
      score -= 15;
    }
  }

  // Check education section
  if (!resumeData.education || resumeData.education.length === 0) {
    issues.push({
      severity: 'warning',
      category: 'structure',
      message: 'No education information listed',
      suggestion: 'Add your education background',
    });
    score -= 15;
  }

  // Check skills section
  if (
    !resumeData.skills ||
    !resumeData.skills.technical ||
    resumeData.skills.technical.length === 0
  ) {
    issues.push({
      severity: 'warning',
      category: 'content',
      message: 'Skills section is missing or empty',
      suggestion: 'Add a skills section with relevant technical and soft skills',
    });
    recommendations.push(
      'Add a skills section with relevant technical and soft skills.'
    );
    score -= 15;
  }

  return Math.max(score, 30);
}

/**
 * Analyze skills section
 */
function analyzeSkills(
  resumeData: ResumeData,
  jobKeywords: string[],
  issues: ATSIssue[],
  recommendations: string[]
): number {
  let score = 100;

  const allSkills = [
    ...(resumeData.skills?.technical || []),
    ...(resumeData.skills?.soft || []),
  ].map((s) => s.toLowerCase());

  if (allSkills.length === 0) {
    issues.push({
      severity: 'critical',
      category: 'content',
      message: 'No skills listed',
      suggestion: 'Add relevant technical and soft skills',
    });
    return 30;
  }

  // Check skill count
  if (allSkills.length < 5) {
    issues.push({
      severity: 'warning',
      category: 'content',
      message: 'Too few skills listed',
      suggestion: 'List 8-12 relevant skills to demonstrate your qualifications',
    });
    recommendations.push(
      'List 8-12 relevant skills to demonstrate your qualifications.'
    );
    score -= 20;
  } else if (allSkills.length > 20) {
    issues.push({
      severity: 'info',
      category: 'content',
      message: 'Too many skills listed',
      suggestion: 'Focus on the most relevant 8-12 skills rather than listing everything',
    });
    recommendations.push(
      'Focus on the most relevant 8-12 skills rather than listing everything.'
    );
    score -= 10;
  }

  // Check for skill-keyword alignment
  if (jobKeywords.length > 0) {
    const skillMatchCount = jobKeywords.filter((keyword) =>
      allSkills.some((skill) => skill.includes(keyword))
    ).length;

    const skillMatchRate = skillMatchCount / Math.min(jobKeywords.length, 15);

    if (skillMatchRate < 0.2) {
      issues.push({
        severity: 'critical',
        category: 'content',
        message: 'Skills section does not align well with job requirements',
        suggestion: 'Add skills that match the job description requirements',
      });
      recommendations.push(
        'Add skills that match the job description requirements.'
      );
      score -= 30;
    } else if (skillMatchRate < 0.4) {
      issues.push({
        severity: 'warning',
        category: 'content',
        message: 'Some key skills from job description are missing',
        suggestion: 'Review job requirements and add missing relevant skills',
      });
      score -= 15;
    }
  }

  return Math.max(score, 30);
}

/**
 * Analyze experience section
 */
function analyzeExperience(
  resumeData: ResumeData,
  jobKeywords: string[],
  issues: ATSIssue[],
  recommendations: string[]
): number {
  let score = 100;

  if (!resumeData.experience || resumeData.experience.length === 0) {
    return 30;
  }

  // Check for quantifiable achievements
  const hasMetrics = resumeData.experience.some((exp) =>
    exp.points.some(
      (point) =>
        point.match(/\d+%/) ||
        point.match(/\$\d+/) ||
        point.match(/\d+\+/) ||
        point.match(/\d+ (users|customers|clients|projects|members|hours)/)
    )
  );

  if (!hasMetrics) {
    issues.push({
      severity: 'warning',
      category: 'content',
      message: 'Experience lacks quantifiable achievements',
      suggestion: 'Add metrics and numbers to demonstrate impact (e.g., "increased sales by 25%")',
    });
    recommendations.push(
      'Add metrics and numbers to demonstrate impact (e.g., "increased sales by 25%").'
    );
    score -= 20;
  }

  // Check for action verbs
  const weakVerbs = ['responsible for', 'helped', 'worked on', 'duties included'];
  const hasWeakVerbs = resumeData.experience.some((exp) =>
    exp.points.some((point) =>
      weakVerbs.some((verb) => point.toLowerCase().includes(verb))
    )
  );

  if (hasWeakVerbs) {
    issues.push({
      severity: 'info',
      category: 'content',
      message: 'Some experience bullets use weak action verbs',
      suggestion: 'Start bullet points with strong action verbs (e.g., "Led", "Developed", "Implemented")',
    });
    recommendations.push(
      'Start bullet points with strong action verbs (e.g., "Led", "Developed", "Implemented").'
    );
    score -= 10;
  }

  // Check for relevant experience
  if (jobKeywords.length > 0) {
    const experienceText = resumeData.experience
      .flatMap((exp) => exp.points)
      .join(' ')
      .toLowerCase();

    const relevantKeywords = jobKeywords.filter((keyword) =>
      experienceText.includes(keyword.toLowerCase())
    );

    const relevanceRate = relevantKeywords.length / Math.min(jobKeywords.length, 20);

    if (relevanceRate < 0.2) {
      issues.push({
        severity: 'critical',
        category: 'content',
        message: 'Experience does not strongly align with job requirements',
        suggestion: 'Tailor your experience descriptions to highlight relevant skills and responsibilities',
      });
      recommendations.push(
        'Tailor your experience descriptions to highlight relevant skills and responsibilities.'
      );
      score -= 25;
    } else if (relevanceRate < 0.4) {
      issues.push({
        severity: 'warning',
        category: 'content',
        message: 'Experience could better highlight job-relevant achievements',
        suggestion: 'Emphasize achievements and responsibilities that align with job requirements',
      });
      score -= 15;
    }
  }

  return Math.max(score, 30);
}
