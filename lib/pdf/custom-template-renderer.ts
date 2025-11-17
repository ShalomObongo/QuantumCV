import PDFDocument from 'pdfkit';
import { ResumeData } from '@/types';
import { CustomTemplate } from '@/lib/firebase/db-utils';

/**
 * Custom Template Renderer
 * Renders resumes using user-uploaded custom templates (HTML or PDF)
 */

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

  // For PDF templates, we'll overlay text on top of the template
  // This requires pdf-lib or similar library
  // For now, return the template as-is with a note

  // TODO: Implement PDF overlay with resume data using pdf-lib
  // This would involve:
  // 1. Load the PDF template
  // 2. Add text fields with resume data at specified positions
  // 3. Return the modified PDF

  return templateBuffer;
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
