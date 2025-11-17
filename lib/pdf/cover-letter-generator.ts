import PDFDocument from 'pdfkit';

export const generateCoverLetterPDF = (content: string): Promise<Buffer> => {
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

      // Subtle header styling
      doc.rect(0, 0, doc.page.width, 40).fill('#f8f9fa');

      doc.moveDown(2);

      // Add paragraphs with proper formatting
      const paragraphs = content.split('\n\n');
      paragraphs.forEach((paragraph, index) => {
        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#000000')
          .text(paragraph.trim(), {
            align: 'justify',
            lineGap: 5,
          });

        if (index < paragraphs.length - 1) {
          doc.moveDown(1.5);
        }
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export const cleanCoverLetterContent = (content: string): string => {
  return content
    .replace(/```/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/^\s*[\r\n]/gm, '\n')
    .replace(/^.*?Dear/m, 'Dear')
    .replace(/[\r\n]{3,}/g, '\n\n')
    .trim();
};
