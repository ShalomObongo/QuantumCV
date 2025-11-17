import { getTemplate, getAllTemplates, RESUME_TEMPLATES } from '@/lib/templates/config';

describe('Resume Templates', () => {
  describe('getAllTemplates', () => {
    it('should return all 5 templates', () => {
      const templates = getAllTemplates();
      expect(templates).toHaveLength(5);
    });

    it('should return templates with required properties', () => {
      const templates = getAllTemplates();
      templates.forEach((template) => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('colors');
        expect(template).toHaveProperty('layout');
        expect(template.colors).toHaveProperty('primary');
        expect(template.colors).toHaveProperty('secondary');
        expect(template.colors).toHaveProperty('accent');
      });
    });

    it('should have valid template IDs', () => {
      const templates = getAllTemplates();
      const validIds = ['modern', 'classic', 'professional', 'creative', 'minimal'];
      templates.forEach((template) => {
        expect(validIds).toContain(template.id);
      });
    });

    it('should have valid layouts', () => {
      const templates = getAllTemplates();
      const validLayouts = ['single-column', 'two-column', 'timeline'];
      templates.forEach((template) => {
        expect(validLayouts).toContain(template.layout);
      });
    });
  });

  describe('getTemplate', () => {
    it('should return modern template by default', () => {
      const template = getTemplate();
      expect(template.id).toBe('modern');
    });

    it('should return correct template for valid ID', () => {
      const template = getTemplate('classic');
      expect(template.id).toBe('classic');
      expect(template.name).toBe('Classic');
    });

    it('should return modern template for undefined ID', () => {
      const template = getTemplate(undefined);
      expect(template.id).toBe('modern');
    });

    it('should have valid color hex codes', () => {
      const templates = getAllTemplates();
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

      templates.forEach((template) => {
        expect(template.colors.primary).toMatch(hexColorRegex);
        expect(template.colors.secondary).toMatch(hexColorRegex);
        expect(template.colors.accent).toMatch(hexColorRegex);
      });
    });
  });

  describe('Template Configurations', () => {
    it('modern template should have two-column layout', () => {
      expect(RESUME_TEMPLATES.modern.layout).toBe('two-column');
    });

    it('classic template should have single-column layout', () => {
      expect(RESUME_TEMPLATES.classic.layout).toBe('single-column');
    });

    it('professional template should have timeline layout', () => {
      expect(RESUME_TEMPLATES.professional.layout).toBe('timeline');
    });

    it('creative template should have two-column layout', () => {
      expect(RESUME_TEMPLATES.creative.layout).toBe('two-column');
    });

    it('minimal template should have single-column layout', () => {
      expect(RESUME_TEMPLATES.minimal.layout).toBe('single-column');
    });
  });
});
