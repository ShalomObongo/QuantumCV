import {
  formatDate,
  generateFileName,
  formatFileSize,
  formatRelativeTime,
  truncateText,
} from '@/lib/utils/helpers';

describe('Helper Functions', () => {
  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('2024-01-15');
    });
  });

  describe('generateFileName', () => {
    it('should generate filename for resume with variant', () => {
      const fileName = generateFileName('resume', 'tailored');
      expect(fileName).toMatch(/^resume_tailored_\d{4}-\d{2}-\d{2}_\d{6}\.pdf$/);
    });

    it('should generate filename for cover letter without variant', () => {
      const fileName = generateFileName('cover_letter');
      expect(fileName).toMatch(/^cover_letter_\d{4}-\d{2}-\d{2}_\d{6}\.pdf$/);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format recent times correctly', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('Just now');

      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');

      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoHoursAgo)).toBe('2 hours ago');

      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const text = 'This is a very long text that needs to be truncated';
      expect(truncateText(text, 20)).toBe('This is a very long ...');
    });

    it('should not truncate short text', () => {
      const text = 'Short text';
      expect(truncateText(text, 20)).toBe('Short text');
    });
  });
});
