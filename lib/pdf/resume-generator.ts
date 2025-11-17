import PDFDocument from 'pdfkit';
import { ResumeData } from '@/types';

export const generateResumePDF = (resumeData: ResumeData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Layout constants
      const leftColumnWidth = 358.5;
      const rightColumnWidth = 165;
      const leftMargin = 50;
      const rightMargin = leftMargin + leftColumnWidth + 15;
      const topMargin = 50;
      const sectionSpacing = 20;

      // Save initial graphics state
      doc.save();

      // Right Column (draw first)
      doc.save();
      doc.rect(rightMargin, 0, rightColumnWidth, doc.page.height).clip();

      let rightColumnY = topMargin;

      // Right header (contact info)
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

      // Calculate content heights for right column sections
      const rightSections = [];

      if (resumeData.skills) {
        rightSections.push({
          title: 'SKILLS',
          content: [
            ...resumeData.skills.technical.map((skill) => `• ${skill}`),
            ...resumeData.skills.soft.map((skill) => `• ${skill}`),
          ],
        });
      }

      if (resumeData.certifications?.length > 0) {
        rightSections.push({
          title: 'CERTIFICATIONS',
          content: resumeData.certifications.map(
            (cert) =>
              `${cert.name}\n${cert.issuer}${cert.date ? ` - ${cert.date}` : ''}`
          ),
        });
      }

      if (resumeData.languages?.length > 0) {
        rightSections.push({
          title: 'LANGUAGES',
          content: resumeData.languages.map(
            (lang) => `${lang.language} - ${lang.level}`
          ),
        });
      }

      rightSections.forEach((section, index) => {
        rightColumnY = addSideSection(doc, section.title, rightColumnY, rightMargin, {
          content: section.content,
          width: rightColumnWidth,
          isLast: index === rightSections.length - 1,
        });
      });

      doc.restore();

      // Left Column
      doc.save();
      doc.rect(leftMargin, 0, leftColumnWidth, doc.page.height).clip();

      let leftColumnY = topMargin;

      // Left header (name and summary)
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

      // Calculate content heights for left column sections
      const leftSections = [
        {
          title: 'EXPERIENCE',
          content: resumeData.experience.map((exp) => ({
            title: `${exp.company}, ${exp.location} — ${exp.title}`,
            subtitle: exp.date,
            description: exp.points.join('\n'),
          })),
        },
        {
          title: 'EDUCATION',
          content: resumeData.education.map((edu) => ({
            title: `${edu.school}${edu.location ? `, ${edu.location}` : ''} — ${edu.degree}`,
            subtitle: edu.date,
            description: edu.details || '',
          })),
        },
      ];

      if (resumeData.projects?.length > 0) {
        leftSections.push({
          title: 'PROJECTS',
          content: resumeData.projects.map((proj) => ({
            title: `${proj.name} — ${proj.role || ''}`,
            subtitle: '',
            description: proj.description,
            link: proj.link,
          })),
        });
      }

      leftSections.forEach((section, index) => {
        leftColumnY = addMainSection(doc, section.title, leftColumnY, leftMargin, {
          content: section.content,
          width: leftColumnWidth,
          isLast: index === leftSections.length - 1,
        });
      });

      doc.restore();
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

function addSideSection(
  doc: PDFKit.PDFDocument,
  title: string,
  startY: number,
  x: number,
  { content, width, isLast }: { content: string[]; width: number; isLast: boolean }
): number {
  const contentStartY = startY + 30;

  // Section header
  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#2079c7')
    .text(title, x, startY, { width: width - 20 });

  let currentY = contentStartY;

  // Section content
  content.forEach((item) => {
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#666666')
      .text(item, x, currentY, {
        width: width - 20,
        align: 'left',
      });
    currentY = doc.y + 5;
  });

  return isLast ? currentY : currentY + 20;
}

function addMainSection(
  doc: PDFKit.PDFDocument,
  title: string,
  startY: number,
  x: number,
  {
    content,
    width,
    isLast,
  }: {
    content: Array<{ title: string; subtitle?: string; description?: string; link?: string }>;
    width: number;
    isLast: boolean;
  }
): number {
  const contentStartY = startY + 30;

  // Section header
  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#2079c7')
    .text(title, x, startY, { width: width - 20 });

  let currentY = contentStartY;

  content.forEach((item, index) => {
    const isLastItem = index === content.length - 1;

    // For projects, add the link at the end of the title
    if (title === 'PROJECTS' && item.link) {
      const titleText = `${item.title}`;
      const linkText = 'Link';

      // Draw title
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(titleText, x, currentY, {
          continued: true,
          width: width - 20,
        });

      // Add space between title and link
      doc.text(' ', { continued: true });

      // Draw link
      doc.fontSize(11).fillColor('#2079c7').text(linkText, {
        link: item.link,
        underline: true,
      });
    } else {
      // Normal title without link
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(item.title, x, currentY, { width: width - 20 });
    }

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

    currentY = doc.y + (isLastItem ? 10 : 15);
  });

  return isLast ? currentY : currentY + 20;
}
