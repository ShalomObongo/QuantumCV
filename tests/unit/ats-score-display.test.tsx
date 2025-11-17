import { render } from '@testing-library/react';
import { ATSScoreDisplay } from '@/components/ats/ats-score-display';
import { ATSScore } from '@/types';

const mockHighScore: ATSScore = {
  overall: 85,
  breakdown: {
    keywords: 90,
    formatting: 85,
    structure: 80,
    skills: 85,
    experience: 85,
  },
  issues: [
    {
      severity: 'info',
      category: 'formatting',
      message: 'Minor formatting suggestion',
      suggestion: 'Consider adding more specific dates',
    },
  ],
  recommendations: [
    'Great job! Your resume is well-optimized',
    'Consider adding more metrics to your achievements',
  ],
  matchedKeywords: ['React', 'Node.js', 'TypeScript', 'AWS'],
  missingKeywords: ['Docker', 'Kubernetes'],
  lastAnalyzed: new Date('2024-01-01'),
};

const mockLowScore: ATSScore = {
  overall: 45,
  breakdown: {
    keywords: 30,
    formatting: 50,
    structure: 40,
    skills: 45,
    experience: 60,
  },
  issues: [
    {
      severity: 'critical',
      category: 'keywords',
      message: 'Only 30% of job keywords found',
      suggestion: 'Add more relevant keywords from job description',
    },
    {
      severity: 'warning',
      category: 'structure',
      message: 'Professional summary is missing',
      suggestion: 'Add a 2-3 sentence professional summary',
    },
  ],
  recommendations: [
    'Add a professional summary',
    'Include more keywords from job description',
    'Expand experience bullet points with metrics',
  ],
  matchedKeywords: ['JavaScript'],
  missingKeywords: [
    'React',
    'Node.js',
    'TypeScript',
    'AWS',
    'Docker',
    'Kubernetes',
  ],
  lastAnalyzed: new Date('2024-01-01'),
};

describe('ATSScoreDisplay Component', () => {
  describe('Overall Score Display', () => {
    it('should display overall score', () => {
      const { getByText } = render(<ATSScoreDisplay score={mockHighScore} />);

      expect(getByText('85')).toBeInTheDocument();
    });

    it('should display score label for high score', () => {
      const { getByText } = render(<ATSScoreDisplay score={mockHighScore} />);

      expect(getByText('Good')).toBeInTheDocument();
    });

    it('should display score label for low score', () => {
      const { getByText } = render(<ATSScoreDisplay score={mockLowScore} />);

      expect(getByText('Needs Work')).toBeInTheDocument();
    });

    it('should display appropriate message for high score', () => {
      const { getByText } = render(<ATSScoreDisplay score={mockHighScore} />);

      expect(
        getByText(/well-optimized for ATS systems/i)
      ).toBeInTheDocument();
    });

    it('should display appropriate message for low score', () => {
      const { getByText } = render(<ATSScoreDisplay score={mockLowScore} />);

      expect(
        getByText(/needs significant improvements/i)
      ).toBeInTheDocument();
    });
  });

  describe('Quick Stats', () => {
    it('should display number of issues', () => {
      const { getByText } = render(<ATSScoreDisplay score={mockHighScore} />);

      expect(getByText('Issues Found')).toBeInTheDocument();
      expect(getByText('1')).toBeInTheDocument();
    });

    it('should display number of matched keywords', () => {
      const { getByText } = render(<ATSScoreDisplay score={mockHighScore} />);

      expect(getByText('Keywords Matched')).toBeInTheDocument();
      expect(getByText('4')).toBeInTheDocument();
    });
  });

  describe('Score Breakdown', () => {
    it('should display all breakdown categories when showDetails is true', () => {
      const { getAllByText } = render(
        <ATSScoreDisplay score={mockHighScore} showDetails={true} />
      );

      expect(getAllByText(/keywords/i).length).toBeGreaterThan(0);
      expect(getAllByText(/formatting/i).length).toBeGreaterThan(0);
      expect(getAllByText(/structure/i).length).toBeGreaterThan(0);
      expect(getAllByText(/skills/i).length).toBeGreaterThan(0);
      expect(getAllByText(/experience/i).length).toBeGreaterThan(0);
    });

    it('should display breakdown scores', () => {
      const { getByText, getAllByText } = render(
        <ATSScoreDisplay score={mockHighScore} showDetails={true} />
      );

      expect(getByText('90/100')).toBeInTheDocument(); // keywords
      expect(getAllByText('85/100').length).toBeGreaterThan(0); // formatting/skills/experience (multiple)
      expect(getByText('80/100')).toBeInTheDocument(); // structure
    });

    it('should not display breakdown when showDetails is false', () => {
      const { queryByText } = render(
        <ATSScoreDisplay score={mockHighScore} showDetails={false} />
      );

      expect(queryByText('Score Breakdown')).not.toBeInTheDocument();
    });
  });

  describe('Issues Display', () => {
    it('should display all issues', () => {
      const { getByText } = render(
        <ATSScoreDisplay score={mockLowScore} showDetails={true} />
      );

      expect(
        getByText('Only 30% of job keywords found')
      ).toBeInTheDocument();
      expect(
        getByText('Professional summary is missing')
      ).toBeInTheDocument();
    });

    it('should display issue suggestions', () => {
      const { getByText } = render(
        <ATSScoreDisplay score={mockLowScore} showDetails={true} />
      );

      expect(
        getByText(/Add more relevant keywords/i)
      ).toBeInTheDocument();
    });

    it('should apply correct styling for critical issues', () => {
      const { container } = render(
        <ATSScoreDisplay score={mockLowScore} showDetails={true} />
      );

      const issueElements = container.querySelectorAll('[class*="bg-red"]');
      expect(issueElements.length).toBeGreaterThan(0);
    });

    it('should apply correct styling for warning issues', () => {
      const { container } = render(
        <ATSScoreDisplay score={mockLowScore} showDetails={true} />
      );

      const issueElements = container.querySelectorAll('[class*="bg-yellow"]');
      expect(issueElements.length).toBeGreaterThan(0);
    });
  });

  describe('Recommendations Display', () => {
    it('should display all recommendations', () => {
      const { getByText } = render(
        <ATSScoreDisplay score={mockHighScore} showDetails={true} />
      );

      mockHighScore.recommendations.forEach((rec) => {
        expect(getByText(rec)).toBeInTheDocument();
      });
    });

    it('should not display recommendations section when showDetails is false', () => {
      const { queryByText } = render(
        <ATSScoreDisplay score={mockHighScore} showDetails={false} />
      );

      expect(queryByText('Recommendations')).not.toBeInTheDocument();
    });
  });

  describe('Keywords Display', () => {
    it('should display matched keywords', () => {
      const { getByText } = render(
        <ATSScoreDisplay score={mockHighScore} showDetails={true} />
      );

      expect(getByText('Matched Keywords')).toBeInTheDocument();
      mockHighScore.matchedKeywords.forEach((keyword) => {
        expect(getByText(keyword)).toBeInTheDocument();
      });
    });

    it('should display missing keywords', () => {
      const { getByText } = render(
        <ATSScoreDisplay score={mockHighScore} showDetails={true} />
      );

      expect(getByText('Missing Keywords')).toBeInTheDocument();
      mockHighScore.missingKeywords.forEach((keyword) => {
        expect(getByText(keyword)).toBeInTheDocument();
      });
    });

    it('should apply correct styling to matched keywords', () => {
      const { container } = render(
        <ATSScoreDisplay score={mockHighScore} showDetails={true} />
      );

      const matchedElements = container.querySelectorAll('[class*="bg-green"]');
      expect(matchedElements.length).toBeGreaterThan(0);
    });

    it('should apply correct styling to missing keywords', () => {
      const { container } = render(
        <ATSScoreDisplay score={mockHighScore} showDetails={true} />
      );

      const missingElements = container.querySelectorAll('[class*="bg-orange"]');
      expect(missingElements.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle score of 100', () => {
      const perfectScore: ATSScore = {
        ...mockHighScore,
        overall: 100,
        breakdown: {
          keywords: 100,
          formatting: 100,
          structure: 100,
          skills: 100,
          experience: 100,
        },
      };

      const { getByText } = render(<ATSScoreDisplay score={perfectScore} />);

      expect(getByText('100')).toBeInTheDocument();
      expect(getByText('Excellent')).toBeInTheDocument();
    });

    it('should handle score of 0', () => {
      const zeroScore: ATSScore = {
        ...mockLowScore,
        overall: 0,
        breakdown: {
          keywords: 0,
          formatting: 0,
          structure: 0,
          skills: 0,
          experience: 0,
        },
      };

      const { getByText } = render(<ATSScoreDisplay score={zeroScore} />);

      expect(getByText('0')).toBeInTheDocument();
      expect(getByText('Poor')).toBeInTheDocument();
    });

    it('should handle empty keywords arrays', () => {
      const emptyKeywords: ATSScore = {
        ...mockHighScore,
        matchedKeywords: [],
        missingKeywords: [],
      };

      const { queryByText } = render(
        <ATSScoreDisplay score={emptyKeywords} showDetails={true} />
      );

      expect(queryByText('Matched Keywords')).not.toBeInTheDocument();
      expect(queryByText('Missing Keywords')).not.toBeInTheDocument();
    });

    it('should handle empty issues array', () => {
      const noIssues: ATSScore = {
        ...mockHighScore,
        issues: [],
      };

      const { queryByText } = render(
        <ATSScoreDisplay score={noIssues} showDetails={true} />
      );

      expect(queryByText('Issues Detected')).not.toBeInTheDocument();
    });
  });
});
