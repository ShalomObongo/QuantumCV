export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  socialLinks: SocialLink[];
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface Experience {
  company: string;
  title: string;
  date: string;
  location: string;
  industry: string;
  points: string[];
  achievements: string[];
}

export interface Education {
  school: string;
  degree: string;
  date: string;
  location?: string;
  details: string;
  grade?: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  role: string;
  link: string;
}

export interface Skills {
  technical: string[];
  soft: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
}

export interface Language {
  language: string;
  level: string;
}

export interface ResumeData {
  contactInfo: ContactInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  skills: Skills;
  achievements: string[];
  certifications: Certification[];
  languages: Language[];
  interests: string[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  resumeData?: ResumeData;
  preferences: {
    theme: 'light' | 'dark';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  userId: string;
  type: 'resume' | 'cover_letter' | 'both';
  variant: 'general' | 'tailored';
  data: ResumeData;
  pdfUrl?: string;
  createdAt: Date;
  jobDescription?: string;
  fileName: string;
  templateId?: string;
  atsScore?: ATSScore;
  versionNumber?: number;
  parentVersionId?: string;
  versionName?: string;
}

// Resume Templates
export type TemplateId = 'modern' | 'classic' | 'professional' | 'creative' | 'minimal';

export interface ResumeTemplate {
  id: TemplateId;
  name: string;
  description: string;
  preview: string;
  category: 'modern' | 'traditional' | 'creative';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  layout: 'single-column' | 'two-column' | 'timeline';
}

// ATS Scoring
export interface ATSScore {
  overall: number; // 0-100
  breakdown: {
    keywords: number;
    formatting: number;
    structure: number;
    skills: number;
    experience: number;
  };
  issues: ATSIssue[];
  recommendations: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  lastAnalyzed: Date;
}

export interface ATSIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'formatting' | 'content' | 'keywords' | 'structure';
  message: string;
  suggestion: string;
}

// Version Control
export interface ResumeVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  versionName: string;
  data: ResumeData;
  createdAt: Date;
  jobDescription?: string;
  atsScore?: ATSScore;
  changes?: string;
}

// Resume Parser
export interface ParseResumeRequest {
  file: File;
  userId: string;
}

export interface ParseResumeResponse {
  success: boolean;
  resumeData?: ResumeData;
  confidence: number;
  warnings?: string[];
  error?: string;
}

// Real-time AI Suggestions
export interface ContentSuggestion {
  id: string;
  type: 'improvement' | 'addition' | 'keyword' | 'rephrasing';
  field: string;
  originalText: string;
  suggestedText: string;
  reason: string;
  impact: 'high' | 'medium' | 'low';
}

export interface SuggestionRequest {
  content: string;
  context: 'summary' | 'experience' | 'skills' | 'achievement';
  jobDescription?: string;
}

export interface GenerateResumeRequest {
  resumeText: string;
  jobDescription?: string;
  isTailored: boolean;
  templateId?: TemplateId;
}

export interface GenerateCoverLetterRequest {
  resumeText: string;
  jobDescription: string;
}

export interface GenerateResumeResponse {
  success: boolean;
  documentId?: string;
  pdfUrl?: string;
  resumeData?: ResumeData;
  error?: string;
}

export interface GenerateCoverLetterResponse {
  success: boolean;
  documentId?: string;
  pdfUrl?: string;
  content?: string;
  error?: string;
}

export type DocumentType = 'resume' | 'cover_letter' | 'both';
export type DocumentVariant = 'general' | 'tailored';
export type Theme = 'light' | 'dark';
