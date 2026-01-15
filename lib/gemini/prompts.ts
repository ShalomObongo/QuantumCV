export const buildResumePrompt = (
  resumeText: string,
  jobDescription: string | null,
  isTailored: boolean
): string => {
  let prompt = isTailored
    ? `Create a highly tailored professional resume from the following text and job description.

Important requirements for tailoring:

1. CONTACT INFORMATION
   - Keep all contact details and social links, but prioritize relevant professional profiles

2. PROFESSIONAL SUMMARY
   - Completely rewrite to directly target the job requirements
   - Feel free to emphasize and amplify relevant experiences
   - Use strong industry keywords from the job description
   - Present the candidate as an ideal fit for the role

3. WORK EXPERIENCE
   - Significantly rewrite and enhance bullet points to match job requirements
   - Feel free to reframe past experiences to better align with the target role
   - Amplify relevant achievements and downplay irrelevant ones
   - Add industry-specific context to generic experiences
   - Use similar terminology and buzzwords from the job description
   - Expand on relevant projects/responsibilities that match the role

4. EDUCATION
   - Reframe educational experiences to highlight relevance
   - Add emphasis to courses/projects that align with job requirements

5. PROJECTS
   - Significantly enhance descriptions of relevant projects
   - Add technical details that match job requirements
   - Emphasize outcomes that demonstrate required competencies

6. SKILLS
   - Rewrite technical skills using job description terminology
   - Add relevant implied skills from experiences
   - Prioritize and emphasize skills mentioned in job description

7. ACHIEVEMENTS
   - Reframe achievements to highlight relevance to the role
   - Enhance descriptions of relevant accomplishments

Critical requirements:
1. While you can significantly enhance and reframe experiences, DO NOT invent completely new experiences
2. DO NOT mention specific company names or job titles from the job description
3. Maintain general timeline accuracy but feel free to emphasize different aspects of each role
4. Focus on making the candidate appear as qualified as possible while staying truthful
5. Use natural, confident language
6. Be creative in finding transferable skills and relevant angles
7. RESPOND ONLY WITH THE JSON OBJECT, NO MARKDOWN`
    : `Create a professional and modern resume from the following text. Format it into clear sections with proper spacing and hierarchy.
        `;

  prompt += `\n\nRespond with a JSON object that has clear section headers and formatted content. Use this structure:
{
    "contactInfo": {
        "name": "",
        "email": "",
        "phone": "",
        "location": "",
        "socialLinks": [{"platform": "", "url": ""}]
    },
    "summary": "",
    "experience": [{
        "company": "",
        "title": "",
        "date": "",
        "location": "",
        "industry": "",
        "points": [],
        "achievements": []
    }],
    "education": [{
        "school": "",
        "degree": "",
        "date": "",
        "location": "",
        "details": "",
        "grade": ""
    }],
    "projects": [{
        "name": "",
        "description": "",
        "technologies": [],
        "role": "",
        "link": ""
    }],
    "skills": {
        "technical": [],
        "soft": []
    },
    "achievements": [],
    "certifications": [{
        "name": "",
        "issuer": "",
        "date": ""
    }],
    "languages": [{
        "language": "",
        "level": ""
    }],
    "interests": []
}`;

  if (isTailored && jobDescription) {
    prompt += `\n\nJob Description:\n${jobDescription}`;
  }

  prompt += `\n\nResume Text:\n${resumeText}`;
  return prompt;
};

export const buildCoverLetterPrompt = (
  resumeText: string,
  jobDescription: string,
  options?: {
    tone?: 'professional' | 'friendly' | 'bold';
    length?: 'short' | 'medium' | 'long';
    format?: 'paragraphs' | 'bullets';
  }
): string => {
  const tone = options?.tone || 'professional';
  const length = options?.length || 'medium';
  const format = options?.format || 'paragraphs';

  const lengthGuidance =
    length === 'short'
      ? 'Keep it short (roughly 150-220 words).'
      : length === 'long'
        ? 'Make it longer and more detailed (roughly 400-550 words).'
        : 'Keep it medium length (roughly 250-350 words).';

  const formatGuidance =
    format === 'bullets'
      ? 'Use a brief intro paragraph, then 3-5 bullet points for key qualifications, then a closing paragraph.'
      : 'Use 3-5 concise paragraphs (no bullet points).';

  const toneGuidance =
    tone === 'friendly'
      ? 'Tone: warm, confident, and human (still professional).'
      : tone === 'bold'
        ? 'Tone: confident and assertive (avoid arrogance).'
        : 'Tone: professional and direct.';

  return `Create a professional and compelling cover letter based on the candidate's resume and the job description.

    Important requirements:
    1. DO NOT include any addresses, headers, or dates at the top
    2. DO NOT use any placeholders like [Company Name] or [Hiring Manager]
    3. If specific information is not available, write the letter without mentioning it
    4. Start directly with "Dear Hiring Team" followed by the letter content
    5. Be concise and professional
    6. Highlight relevant experience and skills from the resume that match the job requirements
    7. Show enthusiasm for the role
    8. Include a strong closing paragraph
    9. DO NOT include any markdown formatting
    10. DO NOT rewrite the job description in the cover letter
    11. ${toneGuidance}
    12. ${lengthGuidance}
    13. ${formatGuidance}

    Resume:
    ${resumeText}

    Job Description:
    ${jobDescription}`;
};
