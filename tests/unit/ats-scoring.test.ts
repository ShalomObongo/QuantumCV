import { calculateATSScore } from '@/lib/ats/scoring';
import { ResumeData } from '@/types';

const mockResumeData: ResumeData = {
  contactInfo: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    location: 'San Francisco, CA',
    socialLinks: [
      { platform: 'LinkedIn', url: 'https://linkedin.com/in/johndoe' },
    ],
  },
  summary:
    'Experienced software engineer with 5 years of experience in full-stack development, specializing in React, Node.js, and cloud technologies.',
  experience: [
    {
      company: 'Tech Corp',
      title: 'Senior Software Engineer',
      date: 'Jan 2020 - Present',
      location: 'San Francisco, CA',
      industry: 'Technology',
      points: [
        'Led development of microservices architecture serving 1M+ users',
        'Improved application performance by 40% through optimization',
        'Mentored team of 5 junior developers',
      ],
      achievements: ['Employee of the Year 2022'],
    },
  ],
  education: [
    {
      school: 'University of California',
      degree: 'Bachelor of Science in Computer Science',
      date: '2015-2019',
      location: 'Berkeley, CA',
      details: 'GPA: 3.8/4.0',
      grade: '3.8',
    },
  ],
  projects: [
    {
      name: 'E-commerce Platform',
      description: 'Built scalable e-commerce platform using React and Node.js',
      technologies: ['React', 'Node.js', 'MongoDB'],
      role: 'Lead Developer',
      link: 'https://github.com/johndoe/ecommerce',
    },
  ],
  skills: {
    technical: [
      'JavaScript',
      'TypeScript',
      'React',
      'Node.js',
      'Python',
      'AWS',
      'Docker',
      'Kubernetes',
    ],
    soft: ['Leadership', 'Communication', 'Problem Solving'],
  },
  achievements: ['Employee of the Year 2022', 'Hackathon Winner 2021'],
  certifications: [
    {
      name: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      date: '2022',
    },
  ],
  languages: [
    { language: 'English', level: 'Native' },
    { language: 'Spanish', level: 'Intermediate' },
  ],
  interests: ['Open Source', 'Machine Learning'],
};

describe('ATS Scoring System', () => {
  describe('calculateATSScore', () => {
    it('should return a valid ATS score object', () => {
      const score = calculateATSScore(mockResumeData);

      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('breakdown');
      expect(score).toHaveProperty('issues');
      expect(score).toHaveProperty('recommendations');
      expect(score).toHaveProperty('matchedKeywords');
      expect(score).toHaveProperty('missingKeywords');
      expect(score).toHaveProperty('lastAnalyzed');
    });

    it('should return overall score between 0 and 100', () => {
      const score = calculateATSScore(mockResumeData);

      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });

    it('should have breakdown scores between 0 and 100', () => {
      const score = calculateATSScore(mockResumeData);

      expect(score.breakdown.keywords).toBeGreaterThanOrEqual(0);
      expect(score.breakdown.keywords).toBeLessThanOrEqual(100);
      expect(score.breakdown.formatting).toBeGreaterThanOrEqual(0);
      expect(score.breakdown.formatting).toBeLessThanOrEqual(100);
      expect(score.breakdown.structure).toBeGreaterThanOrEqual(0);
      expect(score.breakdown.structure).toBeLessThanOrEqual(100);
      expect(score.breakdown.skills).toBeGreaterThanOrEqual(0);
      expect(score.breakdown.skills).toBeLessThanOrEqual(100);
      expect(score.breakdown.experience).toBeGreaterThanOrEqual(0);
      expect(score.breakdown.experience).toBeLessThanOrEqual(100);
    });

    it('should return issues array', () => {
      const score = calculateATSScore(mockResumeData);

      expect(Array.isArray(score.issues)).toBe(true);
      score.issues.forEach((issue) => {
        expect(issue).toHaveProperty('severity');
        expect(issue).toHaveProperty('category');
        expect(issue).toHaveProperty('message');
        expect(issue).toHaveProperty('suggestion');
        expect(['critical', 'warning', 'info']).toContain(issue.severity);
        expect(['formatting', 'content', 'keywords', 'structure']).toContain(
          issue.category
        );
      });
    });

    it('should return recommendations array', () => {
      const score = calculateATSScore(mockResumeData);

      expect(Array.isArray(score.recommendations)).toBe(true);
      expect(score.recommendations.length).toBeLessThanOrEqual(10);
    });

    it('should return lastAnalyzed as Date', () => {
      const score = calculateATSScore(mockResumeData);

      expect(score.lastAnalyzed).toBeInstanceOf(Date);
    });
  });

  describe('Keyword Matching', () => {
    it('should match keywords from job description', () => {
      const jobDescription =
        'Looking for a software engineer with experience in React, Node.js, and AWS';
      const score = calculateATSScore(mockResumeData, jobDescription);

      expect(score.matchedKeywords.length).toBeGreaterThan(0);
    });

    it('should identify missing keywords', () => {
      const jobDescription =
        'Looking for experience in Golang, Rust, and Scala programming';
      const score = calculateATSScore(mockResumeData, jobDescription);

      expect(score.missingKeywords.length).toBeGreaterThan(0);
    });

    it('should have higher score with better keyword match', () => {
      const goodJobDescription =
        'React, Node.js, JavaScript, TypeScript, AWS, Docker, Kubernetes';
      const poorJobDescription = 'Golang, Rust, Scala, Elixir, Haskell';

      const goodScore = calculateATSScore(mockResumeData, goodJobDescription);
      const poorScore = calculateATSScore(mockResumeData, poorJobDescription);

      expect(goodScore.overall).toBeGreaterThan(poorScore.overall);
    });
  });

  describe('Formatting Analysis', () => {
    it('should detect missing email', () => {
      const invalidData = {
        ...mockResumeData,
        contactInfo: { ...mockResumeData.contactInfo, email: '' },
      };
      const score = calculateATSScore(invalidData);

      const hasEmailIssue = score.issues.some(
        (issue) =>
          issue.category === 'formatting' && issue.message.includes('email')
      );
      expect(hasEmailIssue).toBe(true);
    });

    it('should detect short bullet points', () => {
      const invalidData = {
        ...mockResumeData,
        experience: [
          {
            ...mockResumeData.experience[0],
            points: ['Short', 'Too short'],
          },
        ],
      };
      const score = calculateATSScore(invalidData);

      const hasBulletIssue = score.issues.some(
        (issue) =>
          issue.category === 'formatting' && issue.message.includes('bullet')
      );
      expect(hasBulletIssue).toBe(true);
    });
  });

  describe('Structure Analysis', () => {
    it('should detect missing summary', () => {
      const invalidData = { ...mockResumeData, summary: '' };
      const score = calculateATSScore(invalidData);

      const hasSummaryIssue = score.issues.some(
        (issue) =>
          issue.category === 'structure' && issue.message.includes('summary')
      );
      expect(hasSummaryIssue).toBe(true);
    });

    it('should detect missing experience', () => {
      const invalidData = { ...mockResumeData, experience: [] };
      const score = calculateATSScore(invalidData);

      const hasExperienceIssue = score.issues.some(
        (issue) =>
          issue.category === 'structure' && issue.message.includes('experience')
      );
      expect(hasExperienceIssue).toBe(true);
    });

    it('should detect missing skills', () => {
      const invalidData = {
        ...mockResumeData,
        skills: { technical: [], soft: [] },
      };
      const score = calculateATSScore(invalidData);

      const hasSkillsIssue = score.issues.some(
        (issue) =>
          issue.category === 'content' && issue.message.includes('Skills')
      );
      expect(hasSkillsIssue).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle resume with minimal data', () => {
      const minimalData: ResumeData = {
        contactInfo: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '1234567890',
          location: 'City, State',
          socialLinks: [],
        },
        summary: 'A brief summary',
        experience: [],
        education: [],
        projects: [],
        skills: { technical: [], soft: [] },
        achievements: [],
        certifications: [],
        languages: [],
        interests: [],
      };

      const score = calculateATSScore(minimalData);

      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.issues.length).toBeGreaterThan(0);
    });

    it('should handle very long job description', () => {
      const longJobDescription = 'technology '.repeat(1000);
      const score = calculateATSScore(mockResumeData, longJobDescription);

      expect(score).toBeDefined();
      expect(score.overall).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty job description', () => {
      const score = calculateATSScore(mockResumeData, '');

      expect(score).toBeDefined();
      expect(score.matchedKeywords.length).toBe(0);
      expect(score.missingKeywords.length).toBe(0);
    });
  });
});
