import PDFDocument from 'pdfkit';
import { ResumeData, TemplateId } from '@/types';
import { getTemplate } from '@/lib/templates/config';

export const generateTemplatedResumePDF = (
  resumeData: ResumeData,
  templateId: TemplateId = 'modern'
): Promise<Buffer> => {
  const template = getTemplate(templateId);

  switch (template.layout) {
    case 'two-column':
      return generateTwoColumnResume(resumeData, template.colors);
    case 'single-column':
      return generateSingleColumnResume(resumeData, template.colors);
    case 'timeline':
      return generateTimelineResume(resumeData, template.colors);
    default:
      return generateTwoColumnResume(resumeData, template.colors);
  }
};

// Two-Column Layout (Modern, Creative)
function generateTwoColumnResume(
  resumeData: ResumeData,
  colors: { primary: string; secondary: string; accent: string }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const leftColumnWidth = 358.5;
      const rightColumnWidth = 165;
      const leftMargin = 50;
      const rightMargin = leftMargin + leftColumnWidth + 15;
      const topMargin = 50;
      const sectionSpacing = 20;

      doc.save();

      // Right Column
      doc.save();
      doc.rect(rightMargin, 0, rightColumnWidth, doc.page.height).clip();
      let rightColumnY = topMargin;

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#000000')
        .text(resumeData.contactInfo.location, rightMargin, rightColumnY, {
          width: rightColumnWidth,
        })
        .text(resumeData.contactInfo.phone, { width: rightColumnWidth })
        .font('Helvetica-Bold')
        .text(resumeData.contactInfo.email, { width: rightColumnWidth });

      rightColumnY = doc.y + sectionSpacing;

      // Skills
      if (resumeData.skills) {
        rightColumnY = addSideSection(
          doc,
          'SKILLS',
          rightColumnY,
          rightMargin,
          {
            content: [
              ...resumeData.skills.technical.map((skill) => `• ${skill}`),
              ...resumeData.skills.soft.map((skill) => `• ${skill}`),
            ],
            width: rightColumnWidth,
            color: colors.primary,
          }
        );
      }

      // Certifications
      if (resumeData.certifications?.length > 0) {
        rightColumnY = addSideSection(
          doc,
          'CERTIFICATIONS',
          rightColumnY,
          rightMargin,
          {
            content: resumeData.certifications.map(
              (cert) =>
                `${cert.name}\n${cert.issuer}${cert.date ? ` - ${cert.date}` : ''}`
            ),
            width: rightColumnWidth,
            color: colors.primary,
          }
        );
      }

      // Languages
      if (resumeData.languages?.length > 0) {
        rightColumnY = addSideSection(
          doc,
          'LANGUAGES',
          rightColumnY,
          rightMargin,
          {
            content: resumeData.languages.map(
              (lang) => `${lang.language} - ${lang.level}`
            ),
            width: rightColumnWidth,
            color: colors.primary,
          }
        );
      }

      doc.restore();

      // Left Column
      doc.save();
      doc.rect(leftMargin, 0, leftColumnWidth, doc.page.height).clip();
      let leftColumnY = topMargin;

      doc
        .fontSize(36)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(resumeData.contactInfo.name, leftMargin, leftColumnY, {
          width: leftColumnWidth,
        })
        .fontSize(9)
        .font('Helvetica')
        .text(resumeData.summary, leftMargin, doc.y + 5, {
          width: leftColumnWidth,
        });

      leftColumnY = doc.y + sectionSpacing;

      // Experience
      if (resumeData.experience?.length > 0) {
        leftColumnY = addMainSection(doc, 'EXPERIENCE', leftColumnY, leftMargin, {
          content: resumeData.experience.map((exp) => ({
            title: `${exp.company}, ${exp.location} — ${exp.title}`,
            subtitle: exp.date,
            description: exp.points.join('\n'),
          })),
          width: leftColumnWidth,
          color: colors.primary,
        });
      }

      // Education
      if (resumeData.education?.length > 0) {
        leftColumnY = addMainSection(doc, 'EDUCATION', leftColumnY, leftMargin, {
          content: resumeData.education.map((edu) => ({
            title: `${edu.school}${edu.location ? `, ${edu.location}` : ''} — ${edu.degree}`,
            subtitle: edu.date,
            description: edu.details || '',
          })),
          width: leftColumnWidth,
          color: colors.primary,
        });
      }

      // Projects
      if (resumeData.projects?.length > 0) {
        leftColumnY = addMainSection(doc, 'PROJECTS', leftColumnY, leftMargin, {
          content: resumeData.projects.map((proj) => ({
            title: `${proj.name} — ${proj.role || ''}`,
            subtitle: '',
            description: proj.description,
            link: proj.link,
          })),
          width: leftColumnWidth,
          color: colors.primary,
        });
      }

      doc.restore();
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Single-Column Layout (Classic, Minimal)
function generateSingleColumnResume(
  resumeData: ResumeData,
  colors: { primary: string; secondary: string; accent: string }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const contentWidth = 495;
      const leftMargin = 50;
      let currentY = 50;

      // Header
      doc
        .fontSize(32)
        .font('Helvetica-Bold')
        .fillColor(colors.primary)
        .text(resumeData.contactInfo.name, leftMargin, currentY, {
          width: contentWidth,
        });

      currentY = doc.y + 5;

      // Contact Info
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text(
          `${resumeData.contactInfo.email} | ${resumeData.contactInfo.phone} | ${resumeData.contactInfo.location}`,
          leftMargin,
          currentY,
          { width: contentWidth, align: 'center' }
        );

      currentY = doc.y + 15;

      // Divider
      doc
        .moveTo(leftMargin, currentY)
        .lineTo(leftMargin + contentWidth, currentY)
        .strokeColor(colors.primary)
        .lineWidth(2)
        .stroke();

      currentY += 15;

      // Summary
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text(resumeData.summary, leftMargin, currentY, {
          width: contentWidth,
          align: 'justify',
        });

      currentY = doc.y + 20;

      // Experience
      if (resumeData.experience?.length > 0) {
        currentY = addSingleColumnSection(
          doc,
          'EXPERIENCE',
          currentY,
          leftMargin,
          {
            items: resumeData.experience.map((exp) => ({
              title: `${exp.title} at ${exp.company}`,
              subtitle: `${exp.date} | ${exp.location}`,
              description: exp.points.join('\n• '),
            })),
            width: contentWidth,
            color: colors.primary,
          }
        );
      }

      // Education
      if (resumeData.education?.length > 0) {
        currentY = addSingleColumnSection(
          doc,
          'EDUCATION',
          currentY,
          leftMargin,
          {
            items: resumeData.education.map((edu) => ({
              title: edu.degree,
              subtitle: `${edu.school} | ${edu.date}`,
              description: edu.details,
            })),
            width: contentWidth,
            color: colors.primary,
          }
        );
      }

      // Skills
      if (resumeData.skills) {
        currentY = addSingleColumnSection(
          doc,
          'SKILLS',
          currentY,
          leftMargin,
          {
            items: [
              {
                title: 'Technical Skills',
                subtitle: '',
                description: resumeData.skills.technical.join(' • '),
              },
            ],
            width: contentWidth,
            color: colors.primary,
          }
        );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Timeline Layout (Professional)
function generateTimelineResume(
  resumeData: ResumeData,
  colors: { primary: string; secondary: string; accent: string }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const contentWidth = 495;
      const leftMargin = 50;
      const timelineX = 90;
      let currentY = 50;

      // Header
      doc
        .fontSize(36)
        .font('Helvetica-Bold')
        .fillColor(colors.primary)
        .text(resumeData.contactInfo.name, leftMargin, currentY, {
          width: contentWidth,
        });

      currentY = doc.y + 10;

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#666666')
        .text(resumeData.summary, leftMargin, currentY, {
          width: contentWidth,
          align: 'justify',
        });

      currentY = doc.y + 20;

      // Experience Timeline
      if (resumeData.experience?.length > 0) {
        currentY = addTimelineSection(
          doc,
          'PROFESSIONAL EXPERIENCE',
          currentY,
          leftMargin,
          timelineX,
          {
            items: resumeData.experience.map((exp) => ({
              date: exp.date,
              title: `${exp.title} at ${exp.company}`,
              location: exp.location,
              description: exp.points.join('\n• '),
            })),
            width: contentWidth,
            color: colors.primary,
          }
        );
      }

      // Education Timeline
      if (resumeData.education?.length > 0) {
        currentY = addTimelineSection(
          doc,
          'EDUCATION',
          currentY,
          leftMargin,
          timelineX,
          {
            items: resumeData.education.map((edu) => ({
              date: edu.date,
              title: edu.degree,
              location: edu.school,
              description: edu.details,
            })),
            width: contentWidth,
            color: colors.primary,
          }
        );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Helper functions
function addSideSection(
  doc: PDFKit.PDFDocument,
  title: string,
  startY: number,
  x: number,
  {
    content,
    width,
    color,
  }: { content: string[]; width: number; color: string }
): number {
  const contentStartY = startY + 30;

  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor(color)
    .text(title, x, startY, { width: width - 20 });

  let currentY = contentStartY;

  content.forEach((item) => {
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#666666')
      .text(item, x, currentY, { width: width - 20, align: 'left' });
    currentY = doc.y + 5;
  });

  return currentY + 20;
}

function addMainSection(
  doc: PDFKit.PDFDocument,
  title: string,
  startY: number,
  x: number,
  {
    content,
    width,
    color,
  }: {
    content: Array<{
      title: string;
      subtitle?: string;
      description?: string;
      link?: string;
    }>;
    width: number;
    color: string;
  }
): number {
  const contentStartY = startY + 30;

  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor(color)
    .text(title, x, startY, { width: width - 20 });

  let currentY = contentStartY;

  content.forEach((item) => {
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text(item.title, x, currentY, { width: width - 20 });

    if (item.subtitle) {
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#666666')
        .text(item.subtitle, x, doc.y + 5, { width: width - 20 });
    }

    if (item.description) {
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#666666')
        .text(item.description, x, doc.y + 5, {
          width: width - 20,
          align: 'justify',
        });
    }

    currentY = doc.y + 15;
  });

  return currentY + 20;
}

function addSingleColumnSection(
  doc: PDFKit.PDFDocument,
  title: string,
  startY: number,
  x: number,
  {
    items,
    width,
    color,
  }: {
    items: Array<{ title: string; subtitle: string; description: string }>;
    width: number;
    color: string;
  }
): number {
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .fillColor(color)
    .text(title, x, startY, { width });

  let currentY = doc.y + 10;

  items.forEach((item) => {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text(item.title, x, currentY, { width });

    doc
      .fontSize(10)
      .font('Helvetica-Oblique')
      .fillColor('#666666')
      .text(item.subtitle, x, doc.y + 3, { width });

    if (item.description) {
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text(item.description, x, doc.y + 5, { width, align: 'justify' });
    }

    currentY = doc.y + 15;
  });

  return currentY + 10;
}

function addTimelineSection(
  doc: PDFKit.PDFDocument,
  title: string,
  startY: number,
  x: number,
  timelineX: number,
  {
    items,
    width,
    color,
  }: {
    items: Array<{
      date: string;
      title: string;
      location: string;
      description: string;
    }>;
    width: number;
    color: string;
  }
): number {
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .fillColor(color)
    .text(title, x, startY, { width });

  let currentY = doc.y + 15;
  const lineStartY = currentY;

  items.forEach((item, index) => {
    // Timeline dot
    doc.circle(timelineX, currentY + 5, 4).fillAndStroke(color, color);

    // Date
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(color)
      .text(item.date, x, currentY, { width: 80 });

    // Title and location
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text(item.title, timelineX + 20, currentY, { width: width - 90 });

    doc
      .fontSize(10)
      .font('Helvetica-Oblique')
      .fillColor('#666666')
      .text(item.location, timelineX + 20, doc.y + 3, { width: width - 90 });

    if (item.description) {
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text(item.description, timelineX + 20, doc.y + 5, {
          width: width - 90,
        });
    }

    const nextY = doc.y + 20;

    // Timeline line
    if (index < items.length - 1) {
      doc
        .moveTo(timelineX, currentY + 10)
        .lineTo(timelineX, nextY)
        .strokeColor(color)
        .lineWidth(2)
        .stroke();
    }

    currentY = nextY;
  });

  return currentY + 10;
}
