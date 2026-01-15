export function buildResumeParsingPrompt(resumeText: string): string {
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
2. For missing fields, use empty strings \"\" or empty arrays []
3. Normalize dates to format like \"Jan 2020 - Dec 2022\" or \"2020-2022\"
4. For experience points, extract bullet points describing responsibilities and achievements
5. Separate technical skills (programming languages, tools, frameworks) from soft skills (leadership, communication)
6. Extract social links from URLs (LinkedIn, GitHub, portfolio, etc.)
7. If a summary/objective is present, extract it. If not, leave summary as empty string
8. For achievements, extract notable accomplishments, awards, or recognitions
9. Industry should be a general category like \"Technology\", \"Healthcare\", \"Finance\", etc.
10. Ensure all string values are properly escaped for JSON

Resume Text:
${resumeText}

Return the JSON data:`;
}

