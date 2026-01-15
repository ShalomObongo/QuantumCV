import { ResumeTemplate, BuiltInTemplateId } from '@/types';

export const RESUME_TEMPLATES: Record<BuiltInTemplateId, ResumeTemplate> = {
  modern: {
    id: 'modern',
    name: 'Modern Professional',
    description: 'Clean two-column layout with blue accents, perfect for tech and creative roles',
    preview: '/templates/modern-preview.png',
    category: 'modern',
    colors: {
      primary: '#0284c7',
      secondary: '#0369a1',
      accent: '#38bdf8',
    },
    layout: 'two-column',
  },
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional single-column format, ideal for conservative industries',
    preview: '/templates/classic-preview.png',
    category: 'traditional',
    colors: {
      primary: '#1f2937',
      secondary: '#4b5563',
      accent: '#6b7280',
    },
    layout: 'single-column',
  },
  professional: {
    id: 'professional',
    name: 'Professional Executive',
    description: 'Sophisticated design with timeline layout, great for senior positions',
    preview: '/templates/professional-preview.png',
    category: 'traditional',
    colors: {
      primary: '#0f172a',
      secondary: '#334155',
      accent: '#64748b',
    },
    layout: 'timeline',
  },
  creative: {
    id: 'creative',
    name: 'Creative',
    description: 'Bold and modern with teal accents, perfect for design and creative fields',
    preview: '/templates/creative-preview.png',
    category: 'creative',
    colors: {
      primary: '#0d9488',
      secondary: '#14b8a6',
      accent: '#2dd4bf',
    },
    layout: 'two-column',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimalist',
    description: 'Ultra-clean design focusing on content, suitable for all industries',
    preview: '/templates/minimal-preview.png',
    category: 'modern',
    colors: {
      primary: '#374151',
      secondary: '#6b7280',
      accent: '#9ca3af',
    },
    layout: 'single-column',
  },
};

export const getTemplate = (templateId?: BuiltInTemplateId): ResumeTemplate => {
  return RESUME_TEMPLATES[templateId || 'modern'];
};

export const getAllTemplates = (): ResumeTemplate[] => {
  return Object.values(RESUME_TEMPLATES);
};
