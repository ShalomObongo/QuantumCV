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
}

export interface GenerateResumeRequest {
  resumeText: string;
  jobDescription?: string;
  isTailored: boolean;
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
