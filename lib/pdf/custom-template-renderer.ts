import PDFDocument from 'pdfkit';
import { PDFDocument as PDFLibDocument, PDFTextField } from 'pdf-lib';
import { ResumeData } from '@/types';
import { CustomTemplate } from '@/lib/firebase/db-utils';

/**
 * Custom Template Renderer
 * Renders resumes using user-uploaded custom templates (HTML or PDF)
 */

export class CustomTemplateRenderError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number = 400, code: string = 'CUSTOM_TEMPLATE_RENDER_ERROR') {
    super(message);
    this.name = 'CustomTemplateRenderError';
    this.status = status;
    this.code = code;
  }
}

function normalizeFieldName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function joinLines(lines: Array<string | undefined | null>): string {
  return lines
    .map((l) => (typeof l === 'string' ? l.trim() : ''))
    .filter(Boolean)
    .join('\n');
}

function buildDefaultPdfValues(resumeData: ResumeData): Record<string, string> {
  const contact = resumeData.contactInfo;
  const name = contact?.name || '';
  const email = contact?.email || '';
  const phone = contact?.phone || '';
  const location = contact?.location || '';

  const socialLinks = contact?.socialLinks || [];
  const findSocial = (needles: string[]) => {
    const needleSet = needles.map((n) => n.toLowerCase());
    const hit = socialLinks.find((l) =>
      needleSet.some((n) => l.platform?.toLowerCase().includes(n))
    );
    return hit?.url || '';
  };

  const linkedin = findSocial(['linkedin']);
  const github = findSocial(['github']);
  const website = findSocial(['website', 'portfolio', 'personal', 'site']);

  const technicalSkills = resumeData.skills?.technical?.join(', ') || '';
  const softSkills = resumeData.skills?.soft?.join(', ') || '';
  const allSkills = [...(resumeData.skills?.technical || []), ...(resumeData.skills?.soft || [])].join(', ');

  const experience = joinLines(
    (resumeData.experience || []).flatMap((exp) => {
      const header = joinLines([exp.title && exp.company ? `${exp.title} — ${exp.company}` : exp.title || exp.company, exp.date]);
      const loc = exp.location ? exp.location : '';
      const points = (exp.points || []).map((p) => `• ${p}`);
      const achievements = (exp.achievements || []).map((a) => `• ${a}`);
      return [header, loc, ...points, ...(achievements.length ? ['Key Achievements:', ...achievements] : []), ''];
    })
  );

  const education = joinLines(
    (resumeData.education || []).flatMap((edu) => {
      const header = joinLines([edu.degree, edu.school, edu.location, edu.date]);
      const details = joinLines([edu.grade ? `Grade: ${edu.grade}` : '', edu.details || '']);
      return [header, details, ''];
    })
  );

  const projects = joinLines(
    (resumeData.projects || []).flatMap((proj) => {
      const header = joinLines([proj.name, proj.role ? `Role: ${proj.role}` : '', proj.link ? `Link: ${proj.link}` : '']);
      const desc = proj.description || '';
      const tech = proj.technologies?.length ? `Technologies: ${proj.technologies.join(', ')}` : '';
      return [header, desc, tech, ''];
    })
  );

  const certifications = joinLines(
    (resumeData.certifications || []).map((c) => joinLines([c.name, c.issuer ? `Issuer: ${c.issuer}` : '', c.date ? `Date: ${c.date}` : '']))
  );

  const languages = joinLines(
    (resumeData.languages || []).map((l) => `${l.language}${l.level ? ` — ${l.level}` : ''}`)
  );

  return {
    name,
    full_name: name,
    email,
    phone,
    location,
    linkedin,
    github,
    website,
    summary: resumeData.summary || '',
    objective: resumeData.summary || '',
    technical_skills: technicalSkills,
    soft_skills: softSkills,
    skills: allSkills,
    all_skills: allSkills,
    experience,
    work_experience: experience,
    employment: experience,
    education,
    projects,
    certifications,
    languages,
    achievements: joinLines((resumeData.achievements || []).map((a) => `• ${a}`)),
    interests: (resumeData.interests || []).join(', '),
  };
}

function getValueForPdfField(
  fieldName: string,
  resumeData: ResumeData,
  values: Record<string, string>
): string | undefined {
  const normalized = normalizeFieldName(fieldName);

  // Direct / substring matches for common keys
  const directKeys = [
    'full_name',
    'name',
    'email',
    'phone',
    'location',
    'linkedin',
    'github',
    'website',
    'summary',
    'objective',
    'technical_skills',
    'soft_skills',
    'skills',
    'all_skills',
    'experience',
    'work_experience',
    'employment',
    'education',
    'projects',
    'certifications',
    'languages',
    'achievements',
    'interests',
  ] as const;

  for (const key of directKeys) {
    if (normalized === key || normalized.includes(key)) {
      const val = values[key];
      if (val) return val;
    }
  }

  // Indexed experience fields (experience_1_title, exp2_company, etc.)
  const expMatch = normalized.match(/(experience|exp|work)[^0-9]*([0-9]+)/);
  if (expMatch) {
    const index = Math.max(1, Number(expMatch[2])) - 1;
    const exp = resumeData.experience?.[index];
    if (exp) {
      if (normalized.includes('title') || normalized.includes('role') || normalized.includes('position')) return exp.title || '';
      if (normalized.includes('company') || normalized.includes('employer')) return exp.company || '';
      if (normalized.includes('date') || normalized.includes('duration')) return exp.date || '';
      if (normalized.includes('location')) return exp.location || '';
      if (normalized.includes('details') || normalized.includes('description') || normalized.includes('responsibilit')) {
        return joinLines([...(exp.points || []).map((p) => `• ${p}`), ...(exp.achievements || []).map((a) => `• ${a}`)]);
      }
    }
  }

  // Indexed education fields (education_1_school, edu2_degree, etc.)
  const eduMatch = normalized.match(/(education|edu|school|degree)[^0-9]*([0-9]+)/);
  if (eduMatch) {
    const index = Math.max(1, Number(eduMatch[2])) - 1;
    const edu = resumeData.education?.[index];
    if (edu) {
      if (normalized.includes('degree')) return edu.degree || '';
      if (normalized.includes('school') || normalized.includes('institution') || normalized.includes('university')) return edu.school || '';
      if (normalized.includes('date') || normalized.includes('year')) return edu.date || '';
      if (normalized.includes('location')) return edu.location || '';
      if (normalized.includes('grade') || normalized.includes('gpa')) return edu.grade || '';
      if (normalized.includes('details') || normalized.includes('description')) return edu.details || '';
    }
  }

  // Indexed project fields (project_1_name, proj2_description, etc.)
  const projMatch = normalized.match(/(project|proj)[^0-9]*([0-9]+)/);
  if (projMatch) {
    const index = Math.max(1, Number(projMatch[2])) - 1;
    const proj = resumeData.projects?.[index];
    if (proj) {
      if (normalized.includes('name') || normalized.includes('title')) return proj.name || '';
      if (normalized.includes('description') || normalized.includes('details')) return proj.description || '';
      if (normalized.includes('role')) return proj.role || '';
      if (normalized.includes('link') || normalized.includes('url')) return proj.link || '';
      if (normalized.includes('tech') || normalized.includes('stack') || normalized.includes('tool')) return proj.technologies?.join(', ') || '';
    }
  }

  return undefined;
}

/**
 * Render resume using custom HTML template
 */
export async function renderHTMLTemplate(
  resumeData: ResumeData,
  htmlTemplate: string
): Promise<Buffer> {
  // Replace template variables with actual data
  let processedHTML = htmlTemplate;

  // Contact Info
  processedHTML = processedHTML.replace(/\{\{name\}\}/g, resumeData.contactInfo?.name || '');
  processedHTML = processedHTML.replace(/\{\{email\}\}/g, resumeData.contactInfo?.email || '');
  processedHTML = processedHTML.replace(/\{\{phone\}\}/g, resumeData.contactInfo?.phone || '');
  processedHTML = processedHTML.replace(/\{\{location\}\}/g, resumeData.contactInfo?.location || '');

  // Summary
  processedHTML = processedHTML.replace(/\{\{summary\}\}/g, resumeData.summary || '');

  // Experience section
  if (resumeData.experience && resumeData.experience.length > 0) {
    const experienceHTML = resumeData.experience
      .map(
        (exp) => `
      <div class="experience-item">
        <div class="experience-header">
          <h3>${exp.title} - ${exp.company}</h3>
          <span class="date">${exp.date}</span>
        </div>
        <p class="location">${exp.location}</p>
        <ul class="points">
          ${exp.points?.map((point) => `<li>${point}</li>`).join('') || ''}
        </ul>
        ${
          exp.achievements && exp.achievements.length > 0
            ? `<div class="achievements">
            <strong>Key Achievements:</strong>
            <ul>${exp.achievements.map((ach) => `<li>${ach}</li>`).join('')}</ul>
          </div>`
            : ''
        }
      </div>
    `
      )
      .join('');
    processedHTML = processedHTML.replace(/\{\{experience\}\}/g, experienceHTML);
  }

  // Education section
  if (resumeData.education && resumeData.education.length > 0) {
    const educationHTML = resumeData.education
      .map(
        (edu) => `
      <div class="education-item">
        <h3>${edu.degree}</h3>
        <p>${edu.school} - ${edu.location}</p>
        <p class="date">${edu.date}</p>
        ${edu.grade ? `<p>Grade: ${edu.grade}</p>` : ''}
        ${edu.details ? `<p>${edu.details}</p>` : ''}
      </div>
    `
      )
      .join('');
    processedHTML = processedHTML.replace(/\{\{education\}\}/g, educationHTML);
  }

  // Skills
  const technicalSkills = resumeData.skills?.technical?.join(', ') || '';
  const softSkills = resumeData.skills?.soft?.join(', ') || '';
  processedHTML = processedHTML.replace(/\{\{technical_skills\}\}/g, technicalSkills);
  processedHTML = processedHTML.replace(/\{\{soft_skills\}\}/g, softSkills);
  processedHTML = processedHTML.replace(
    /\{\{all_skills\}\}/g,
    [...(resumeData.skills?.technical || []), ...(resumeData.skills?.soft || [])].join(', ')
  );

  // Projects
  if (resumeData.projects && resumeData.projects.length > 0) {
    const projectsHTML = resumeData.projects
      .map(
        (proj) => `
      <div class="project-item">
        <h3>${proj.name}</h3>
        <p>${proj.description}</p>
        <p><strong>Technologies:</strong> ${proj.technologies?.join(', ') || ''}</p>
        ${proj.role ? `<p><strong>Role:</strong> ${proj.role}</p>` : ''}
        ${proj.link ? `<p><a href="${proj.link}">${proj.link}</a></p>` : ''}
      </div>
    `
      )
      .join('');
    processedHTML = processedHTML.replace(/\{\{projects\}\}/g, projectsHTML);
  }

  // Certifications
  if (resumeData.certifications && resumeData.certifications.length > 0) {
    const certificationsHTML = resumeData.certifications
      .map(
        (cert) => `
      <div class="certification-item">
        <h4>${cert.name}</h4>
        <p>${cert.issuer} - ${cert.date}</p>
      </div>
    `
      )
      .join('');
    processedHTML = processedHTML.replace(/\{\{certifications\}\}/g, certificationsHTML);
  }

  // Languages
  if (resumeData.languages && resumeData.languages.length > 0) {
    const languagesHTML = resumeData.languages
      .map((lang) => `<li>${lang.language} - ${lang.level}</li>`)
      .join('');
    processedHTML = processedHTML.replace(/\{\{languages\}\}/g, `<ul>${languagesHTML}</ul>`);
  }

  // Achievements
  if (resumeData.achievements && resumeData.achievements.length > 0) {
    const achievementsHTML = resumeData.achievements.map((ach) => `<li>${ach}</li>`).join('');
    processedHTML = processedHTML.replace(/\{\{achievements\}\}/g, `<ul>${achievementsHTML}</ul>`);
  }

  // Interests
  const interests = resumeData.interests?.join(', ') || '';
  processedHTML = processedHTML.replace(/\{\{interests\}\}/g, interests);

  // Convert HTML to PDF using a library (puppeteer or similar)
  // For now, we'll create a simple PDF with the processed HTML
  // In production, you'd use puppeteer or a similar tool
  return await convertHTMLToPDF(processedHTML);
}

/**
 * Convert HTML to PDF
 * Note: In production, use Puppeteer or similar for better HTML rendering
 */
async function convertHTMLToPDF(html: string): Promise<Buffer> {
  // For now, create a basic PDF
  // TODO: Implement proper HTML to PDF conversion with Puppeteer
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  // Add a note about HTML templates
  doc
    .fontSize(12)
    .text(
      'Custom HTML Template Rendering',
      { align: 'center' }
    );
  doc.moveDown();
  doc
    .fontSize(10)
    .text(
      'Note: Full HTML template rendering requires Puppeteer. This is a basic fallback.',
      { align: 'center' }
    );
  doc.moveDown(2);

  // Strip HTML tags for basic text rendering
  const plainText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  doc.fontSize(9).text(plainText, {
    align: 'left',
    lineGap: 4,
  });

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
}

/**
 * Render resume using custom PDF template
 */
export async function renderPDFTemplate(
  resumeData: ResumeData,
  pdfTemplateBase64: string
): Promise<Buffer> {
  // Decode base64 PDF
  const templateBuffer = Buffer.from(pdfTemplateBase64, 'base64');

  // For PDF templates, we currently support *fillable* PDF forms (AcroForm).
  // If a template isn't fillable, we return a clear error instead of silently returning the original template.
  try {
    const pdfDoc = await PDFLibDocument.load(templateBuffer);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    const textFields = fields.filter(
      (f) => f instanceof PDFTextField || (f as any)?.constructor?.name === 'PDFTextField'
    ) as PDFTextField[];

    if (textFields.length === 0) {
      throw new CustomTemplateRenderError(
        'This PDF template has no fillable fields. Please upload a fillable PDF form (AcroForm) or use a built-in template.',
        400,
        'PDF_TEMPLATE_NOT_FILLABLE'
      );
    }

    const values = buildDefaultPdfValues(resumeData);
    let filled = 0;
    for (const field of textFields) {
      const name = field.getName();
      const value = getValueForPdfField(name, resumeData, values);
      if (!value) continue;
      try {
        field.setText(value);
        filled += 1;
      } catch {
        // Skip fields that fail to set (e.g., read-only or incompatible)
      }
    }

    if (filled === 0) {
      throw new CustomTemplateRenderError(
        'This PDF template is fillable, but QuantumCV could not match any field names to your resume data. Rename your PDF form fields (e.g., name, email, phone, summary, skills, experience, education) or use a built-in template.',
        400,
        'PDF_TEMPLATE_FIELDS_UNMATCHED'
      );
    }

    form.flatten();
    const bytes = await pdfDoc.save();
    return Buffer.from(bytes);
  } catch (error) {
    if (error instanceof CustomTemplateRenderError) {
      throw error;
    }
    console.error('Custom PDF template rendering failed:', error);
    throw new CustomTemplateRenderError(
      'Failed to render the custom PDF template. Please ensure it is a valid fillable PDF form.',
      400,
      'PDF_TEMPLATE_RENDER_FAILED'
    );
  }
}

/**
 * Main function to render resume with custom template
 */
export async function renderCustomTemplate(
  resumeData: ResumeData,
  customTemplate: CustomTemplate
): Promise<Buffer> {
  if (customTemplate.type === 'html') {
    // Decode base64 HTML
    const htmlTemplate = Buffer.from(customTemplate.content, 'base64').toString('utf-8');
    return await renderHTMLTemplate(resumeData, htmlTemplate);
  } else {
    // PDF template
    return await renderPDFTemplate(resumeData, customTemplate.content);
  }
}

/**
 * Get example HTML template for users
 */
export function getExampleHTMLTemplate(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 { color: #2c3e50; }
    .header {
      text-align: center;
      border-bottom: 2px solid #2c3e50;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .contact-info {
      text-align: center;
      font-size: 14px;
      margin-bottom: 20px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    .experience-item, .education-item, .project-item {
      margin-bottom: 15px;
    }
    .date {
      color: #7f8c8d;
      font-style: italic;
    }
    ul {
      margin-left: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{name}}</h1>
  </div>

  <div class="contact-info">
    {{email}} | {{phone}} | {{location}}
  </div>

  <div class="section">
    <h2>Professional Summary</h2>
    <p>{{summary}}</p>
  </div>

  <div class="section">
    <h2>Work Experience</h2>
    {{experience}}
  </div>

  <div class="section">
    <h2>Education</h2>
    {{education}}
  </div>

  <div class="section">
    <h2>Skills</h2>
    <p><strong>Technical:</strong> {{technical_skills}}</p>
    <p><strong>Soft Skills:</strong> {{soft_skills}}</p>
  </div>

  <div class="section">
    <h2>Projects</h2>
    {{projects}}
  </div>

  <div class="section">
    <h2>Certifications</h2>
    {{certifications}}
  </div>
</body>
</html>`;
}
