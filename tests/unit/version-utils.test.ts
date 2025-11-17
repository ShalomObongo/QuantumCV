import { compareVersions } from '@/lib/firebase/version-utils';
import { ResumeVersion, ResumeData } from '@/types';

const mockResumeData1: ResumeData = {
  contactInfo: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    location: 'San Francisco, CA',
    socialLinks: [],
  },
  summary: 'Software engineer with 5 years of experience',
  experience: [
    {
      company: 'Tech Corp',
      title: 'Senior Engineer',
      date: '2020-Present',
      location: 'SF',
      industry: 'Tech',
      points: ['Point 1', 'Point 2'],
      achievements: [],
    },
  ],
  education: [
    {
      school: 'University',
      degree: 'BS Computer Science',
      date: '2015-2019',
      details: '',
    },
  ],
  projects: [],
  skills: {
    technical: ['React', 'Node.js', 'TypeScript'],
    soft: ['Leadership'],
  },
  achievements: [],
  certifications: [],
  languages: [],
  interests: [],
};

const mockResumeData2: ResumeData = {
  ...mockResumeData1,
  contactInfo: {
    ...mockResumeData1.contactInfo,
    email: 'newemail@example.com',
  },
  summary: 'Software engineer with 6 years of experience',
  skills: {
    technical: ['React', 'Node.js', 'TypeScript', 'Python'],
    soft: ['Leadership', 'Communication'],
  },
};

const mockVersion1: ResumeVersion = {
  id: 'v1',
  documentId: 'doc1',
  versionNumber: 1,
  versionName: 'Initial Version',
  data: mockResumeData1,
  createdAt: new Date('2024-01-01'),
  atsScore: {
    overall: 75,
    breakdown: {
      keywords: 70,
      formatting: 80,
      structure: 75,
      skills: 70,
      experience: 80,
    },
    issues: [],
    recommendations: [],
    matchedKeywords: [],
    missingKeywords: [],
    lastAnalyzed: new Date('2024-01-01'),
  },
};

const mockVersion2: ResumeVersion = {
  id: 'v2',
  documentId: 'doc1',
  versionNumber: 2,
  versionName: 'Updated Version',
  data: mockResumeData2,
  createdAt: new Date('2024-01-15'),
  atsScore: {
    overall: 85,
    breakdown: {
      keywords: 80,
      formatting: 85,
      structure: 85,
      skills: 85,
      experience: 85,
    },
    issues: [],
    recommendations: [],
    matchedKeywords: [],
    missingKeywords: [],
    lastAnalyzed: new Date('2024-01-15'),
  },
};

describe('Version Control Utilities', () => {
  describe('compareVersions', () => {
    it('should detect differences in contact info', () => {
      const differences = compareVersions(mockVersion1, mockVersion2);

      const emailDiff = differences.find(
        (d) => d.category === 'Contact Info' && d.field === 'email'
      );
      expect(emailDiff).toBeDefined();
      expect(emailDiff?.isDifferent).toBe(true);
      expect(emailDiff?.version1Value).toBe('john@example.com');
      expect(emailDiff?.version2Value).toBe('newemail@example.com');
    });

    it('should detect differences in summary', () => {
      const differences = compareVersions(mockVersion1, mockVersion2);

      const summaryDiff = differences.find((d) => d.category === 'Summary');
      expect(summaryDiff).toBeDefined();
      expect(summaryDiff?.isDifferent).toBe(true);
    });

    it('should detect differences in skills', () => {
      const differences = compareVersions(mockVersion1, mockVersion2);

      const skillsDiff = differences.find((d) => d.category === 'Skills');
      expect(skillsDiff).toBeDefined();
      expect(skillsDiff?.isDifferent).toBe(true);
    });

    it('should detect differences in ATS scores', () => {
      const differences = compareVersions(mockVersion1, mockVersion2);

      const atsScoreDiff = differences.find((d) => d.category === 'ATS Score');
      expect(atsScoreDiff).toBeDefined();
      expect(atsScoreDiff?.version1Value).toBe(75);
      expect(atsScoreDiff?.version2Value).toBe(85);
    });

    it('should return empty array for identical versions', () => {
      const differences = compareVersions(mockVersion1, mockVersion1);

      expect(differences.length).toBe(0);
    });

    it('should handle versions without ATS scores', () => {
      const v1WithoutScore = { ...mockVersion1, atsScore: undefined };
      const v2WithoutScore = { ...mockVersion2, atsScore: undefined };

      const differences = compareVersions(v1WithoutScore, v2WithoutScore);

      const atsScoreDiff = differences.find((d) => d.category === 'ATS Score');
      expect(atsScoreDiff).toBeUndefined();
    });

    it('should detect all changed fields', () => {
      const differences = compareVersions(mockVersion1, mockVersion2);

      expect(differences.length).toBeGreaterThan(0);
      differences.forEach((diff) => {
        expect(diff).toHaveProperty('category');
        expect(diff).toHaveProperty('field');
        expect(diff).toHaveProperty('version1Value');
        expect(diff).toHaveProperty('version2Value');
        expect(diff).toHaveProperty('isDifferent');
        expect(diff.isDifferent).toBe(true);
      });
    });

    it('should handle complex nested differences', () => {
      const complexData1 = {
        ...mockResumeData1,
        experience: [
          {
            company: 'Company A',
            title: 'Engineer',
            date: '2020-2022',
            location: 'City A',
            industry: 'Tech',
            points: ['Point 1'],
            achievements: [],
          },
        ],
      };

      const complexData2 = {
        ...mockResumeData1,
        experience: [
          {
            company: 'Company B',
            title: 'Senior Engineer',
            date: '2020-2023',
            location: 'City B',
            industry: 'Tech',
            points: ['Point 1', 'Point 2'],
            achievements: ['Award'],
          },
        ],
      };

      const v1 = { ...mockVersion1, data: complexData1 };
      const v2 = { ...mockVersion2, data: complexData2 };

      const differences = compareVersions(v1, v2);

      const experienceDiff = differences.find((d) => d.category === 'Experience');
      expect(experienceDiff).toBeDefined();
    });
  });

  describe('Version Metadata', () => {
    it('should have valid version structure', () => {
      expect(mockVersion1).toHaveProperty('id');
      expect(mockVersion1).toHaveProperty('documentId');
      expect(mockVersion1).toHaveProperty('versionNumber');
      expect(mockVersion1).toHaveProperty('versionName');
      expect(mockVersion1).toHaveProperty('data');
      expect(mockVersion1).toHaveProperty('createdAt');
    });

    it('should have incrementing version numbers', () => {
      expect(mockVersion2.versionNumber).toBeGreaterThan(
        mockVersion1.versionNumber
      );
    });

    it('should have valid dates', () => {
      expect(mockVersion1.createdAt).toBeInstanceOf(Date);
      expect(mockVersion2.createdAt).toBeInstanceOf(Date);
      expect(mockVersion2.createdAt.getTime()).toBeGreaterThan(
        mockVersion1.createdAt.getTime()
      );
    });
  });
});
