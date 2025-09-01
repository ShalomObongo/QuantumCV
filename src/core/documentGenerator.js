const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
require('dotenv').config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Utility Functions
function formatDate() {
    const date = new Date();
    return date.toISOString().split('T')[0];
}

function generateFileName(type, variant = '') {
    const date = formatDate();
    const time = new Date().getTime().toString().slice(-6);
    const cleanVariant = variant ? `_${variant}` : '';
    return `${type}${cleanVariant}_${date}_${time}.pdf`;
}

function cleanAIResponse(response) {
    return response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^#.*$/gm, '')
        .replace(/^\s*[\r\n]/gm, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .trim();
}

// Prompt Building
function buildResumePrompt(resumeText, jobDescription, isTailored) {
    let prompt = isTailored ? 
        `Create a highly tailored professional resume from the following text and job description.
        
Important requirements for tailoring:

1. CONTACT INFORMATION
   - Keep all contact details and social links, but prioritize relevant professional profiles

2. PROFESSIONAL SUMMARY
   - Completely rewrite to directly target the job requirements
   - Feel free to emphasize and amplify relevant experiences
   - Use strong industry keywords from the job description
   - Present the candidate as an ideal fit for the role

3. WORK EXPERIENCE
   - Significantly rewrite and enhance bullet points to match job requirements
   - Feel free to reframe past experiences to better align with the target role
   - Amplify relevant achievements and downplay irrelevant ones
   - Add industry-specific context to generic experiences
   - Use similar terminology and buzzwords from the job description
   - Expand on relevant projects/responsibilities that match the role

4. EDUCATION
   - Reframe educational experiences to highlight relevance
   - Add emphasis to courses/projects that align with job requirements

5. PROJECTS
   - Significantly enhance descriptions of relevant projects
   - Add technical details that match job requirements
   - Emphasize outcomes that demonstrate required competencies

6. SKILLS
   - Rewrite technical skills using job description terminology
   - Add relevant implied skills from experiences
   - Prioritize and emphasize skills mentioned in job description

7. ACHIEVEMENTS
   - Reframe achievements to highlight relevance to the role
   - Enhance descriptions of relevant accomplishments

Critical requirements:
1. While you can significantly enhance and reframe experiences, DO NOT invent completely new experiences
2. DO NOT mention specific company names or job titles from the job description
3. Maintain general timeline accuracy but feel free to emphasize different aspects of each role
4. Focus on making the candidate appear as qualified as possible while staying truthful
5. Use natural, confident language
6. Be creative in finding transferable skills and relevant angles
7. RESPOND ONLY WITH THE JSON OBJECT, NO MARKDOWN` :
        `Create a professional and modern resume from the following text. Format it into clear sections with proper spacing and hierarchy.
        `;

    prompt += `\n\nRespond with a JSON object that has clear section headers and formatted content. Use this structure:
{
    "contactInfo": {
        "name": "",
        "email": "",
        "phone": "",
        "location": "",
        "socialLinks": [{"platform": "", "url": ""}]
    },
    "summary": "",
    "experience": [{
        "company": "",
        "title": "",
        "date": "",
        "location": "",
        "industry": "",
        "points": [],
        "achievements": []
    }],
    "education": [{
        "school": "",
        "degree": "",
        "date": "",
        "details": "",
        "grade": ""
    }],
    "projects": [{
        "name": "",
        "description": "",
        "technologies": [],
        "role": "",
        "link": ""
    }],
    "skills": {
        "technical": [],
        "soft": []
    },
    "achievements": [],
    "certifications": [{
        "name": "",
        "issuer": "",
        "date": ""
    }],
    "languages": [{
        "language": "",
        "level": ""
    }],
    "interests": []
}`;

    if (isTailored) {
        prompt += `\n\nJob Description:\n${jobDescription}`;
    }
    
    prompt += `\n\nResume Text:\n${resumeText}`;
    return prompt;
}

function buildCoverLetterPrompt(resumeText, jobDescription) {
    return `Create a professional and compelling cover letter based on the candidate's resume and the job description. 
    
    Important requirements:
    1. DO NOT include any addresses, headers, or dates at the top
    2. DO NOT use any placeholders like [Company Name] or [Hiring Manager]
    3. If specific information is not available, write the letter without mentioning it
    4. Start directly with "Dear Hiring Team" followed by the letter content
    5. Be concise and professional
    6. Highlight relevant experience and skills from the resume that match the job requirements
    7. Show enthusiasm for the role
    8. Include a strong closing paragraph
    9. DO NOT include any markdown formatting
    10. DO NOT rewrite the job description in the cover letter

    Resume:
    ${resumeText}

    Job Description:
    ${jobDescription}`;
}

// Document Generation Functions
async function generateResume(resumeText, jobDescription = '', isTailored = false, outputDir) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    const prompt = buildResumePrompt(resumeText, jobDescription, isTailored);
    
    const result = await model.generateContent(prompt);
    const cleanedResponse = cleanAIResponse(result.response.text());

    try {
        const resumeData = JSON.parse(cleanedResponse);
        const variant = isTailored ? 'tailored' : 'general';
        const fileName = generateFileName('resume', variant);
        const pdfPath = path.join(outputDir, fileName);
        await generateStyledPDF(resumeData, pdfPath);
        return { pdfPath, fileName, data: resumeData };
    } catch (error) {
        console.error('Error parsing AI response:', error);
        throw new Error('Failed to parse resume data');
    }
}

async function generateCoverLetterContent(resumeText, jobDescription) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    const prompt = buildCoverLetterPrompt(resumeText, jobDescription);
    
    const result = await model.generateContent(prompt);
    const coverLetter = result.response.text();
    
    return coverLetter
        .replace(/```/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/^\s*[\r\n]/gm, '\n')
        .replace(/^.*?Dear/m, 'Dear')
        .replace(/[\r\n]{3,}/g, '\n\n')
        .trim();
}

async function generateCoverLetter(resumeText, jobDescription, outputDir) {
    const content = await generateCoverLetterContent(resumeText, jobDescription);
    const fileName = generateFileName('cover_letter');
    const pdfPath = path.join(outputDir, fileName);
    await generateStyledCoverLetterPDF(content, pdfPath);
    return { pdfPath, fileName, content };
}

async function generateDocument(type, resumeText, jobDescription = null, outputDir) {
    try {
        if (type === 'resume') {
            return await generateResume(resumeText, jobDescription, !!jobDescription, outputDir);
        } else if (type === 'cover_letter') {
            return await generateCoverLetter(resumeText, jobDescription, outputDir);
        }
    } catch (error) {
        console.error(`Error generating ${type}:`, error);
        throw new Error(`Failed to generate ${type}`);
    }
}

// PDF Generation Functions
async function generateStyledPDF(resumeData, outputPath) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4'
        });
        const stream = fs.createWriteStream(outputPath);

        doc.pipe(stream);

        // Layout constants
        const leftColumnWidth = 358.5;
        const rightColumnWidth = 165;
        const leftMargin = 50;
        const rightMargin = leftMargin + leftColumnWidth + 15;
        const topMargin = 50;
        const headerHeight = 80;
        const sectionSpacing = 20; // Base spacing between sections

        // Save initial graphics state
        doc.save();

        // Right Column (draw first)
        doc.save();
        doc.rect(rightMargin, 0, rightColumnWidth, doc.page.height).clip();

        let rightColumnY = topMargin;

        // Right header (contact info)
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#000000')
           .text(resumeData.contactInfo.location, rightMargin, rightColumnY, { width: rightColumnWidth })
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
                    ...resumeData.skills.technical.map(skill => `• ${skill}`),
                    ...resumeData.skills.soft.map(skill => `• ${skill}`)
                ]
            });
        }

        if (resumeData.certifications?.length > 0) {
            rightSections.push({
                title: 'CERTIFICATIONS',
                content: resumeData.certifications.map(cert => 
                    `${cert.name}\n${cert.issuer}${cert.date ? ` - ${cert.date}` : ''}`
                )
            });
        }

        if (resumeData.languages?.length > 0) {
            rightSections.push({
                title: 'LANGUAGES',
                content: resumeData.languages.map(lang => 
                    `${lang.language} - ${lang.level}`
                )
            });
        }

        // Calculate available space and distribute it
        const rightColumnHeight = doc.page.height - topMargin - 50; // 50 is bottom margin
        const totalSections = rightSections.length;
        
        rightSections.forEach((section, index) => {
            rightColumnY = addSideSection(doc, section.title, rightColumnY, rightMargin, {
                content: section.content,
                width: rightColumnWidth,
                isLast: index === totalSections - 1
            });
        });

        doc.restore();

        // Left Column
        doc.save();
        doc.rect(leftMargin, 0, leftColumnWidth, doc.page.height).clip();

        let leftColumnY = topMargin;

        // Left header (name and summary)
        doc.fontSize(36)
           .font('Helvetica-Bold')
           .fillColor('#000000')
           .text(resumeData.contactInfo.name, leftMargin, leftColumnY, { width: leftColumnWidth })
           .fontSize(9)
           .font('Helvetica')
           .text(resumeData.summary, leftMargin, doc.y + 5, { width: leftColumnWidth });

        leftColumnY = doc.y + sectionSpacing;

        // Calculate content heights for left column sections
        const leftSections = [
            {
                title: 'EXPERIENCE',
                content: resumeData.experience.map(exp => ({
                    title: `${exp.company}, ${exp.location} — ${exp.title}`,
                    subtitle: exp.date,
                    description: exp.points.join('\n')
                }))
            },
            {
                title: 'EDUCATION',
                content: resumeData.education.map(edu => ({
                    title: `${edu.school}, ${edu.location || ''} — ${edu.degree}`,
                    subtitle: edu.date,
                    description: edu.details || ''
                }))
            }
        ];

        if (resumeData.projects?.length > 0) {
            leftSections.push({
                title: 'PROJECTS',
                content: resumeData.projects.map(proj => ({
                    title: `${proj.name} — ${proj.role || ''}`,
                    description: proj.description,
                    link: proj.link
                }))
            });
        }

        // Add left column sections with dynamic spacing
        leftSections.forEach((section, index) => {
            leftColumnY = addMainSection(doc, section.title, leftColumnY, leftMargin, {
                content: section.content,
                width: leftColumnWidth,
                isLast: index === leftSections.length - 1
            });
        });

        doc.restore();
        doc.end();
        stream.on('finish', resolve);
        stream.on('error', reject);
    });
}

function addSideSection(doc, title, startY, x, { content, width, isLast }) {
    const contentStartY = startY + 30;
    
    // Section header
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#2079c7')
       .text(title, x, startY, { width: width - 20 });

    let currentY = contentStartY;

    // Section content
    content.forEach(item => {
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#666666')
           .text(item, x, currentY, {
               width: width - 20,
               align: 'left'
           });
        currentY = doc.y + 5;
    });

    // Add spacing only if not the last section
    return isLast ? currentY : currentY + 20;
}

function addMainSection(doc, title, startY, x, { content, width, isLast }) {
    const contentStartY = startY + 30;
    
    // Section header
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#2079c7')
       .text(title, x, startY, { width: width - 20 });

    let currentY = contentStartY;

    // Section content
    content.forEach((item, index) => {
        const isLastItem = index === content.length - 1;
        
        // For projects, add the link at the end of the title
        if (title === 'PROJECTS' && item.link) {
            const titleText = `${item.title}`;
            const linkText = 'Link';
            
            // Calculate positions
            const titleWidth = doc.widthOfString(titleText);
            const linkWidth = doc.widthOfString(linkText);
            const spacing = 5; // Space between title and link
            
            // Draw title
            doc.fontSize(11)
               .font('Helvetica-Bold')
               .fillColor('#000000')
               .text(titleText, x, currentY, {
                   continued: true,
                   width: width - 20 - linkWidth - spacing
               });

            // Add space between title and link
            doc.text(' ', {
                continued: true
            });

            // Draw link
            doc.fontSize(11)
               .fillColor('#2079c7')
               .text(linkText, {
                   link: item.link,
                   underline: true
               });
        } else {
            // Normal title without link
            doc.fontSize(11)
               .font('Helvetica-Bold')
               .fillColor('#000000')
               .text(item.title, x, currentY, { width: width - 20 });
        }

        if (item.subtitle) {
            doc.fontSize(8)
               .font('Helvetica')
               .fillColor('#666666')
               .text(item.subtitle, x, doc.y + 5, { width: width - 20 });
        }

        if (item.description) {
            doc.fontSize(9)
               .font('Helvetica')
               .fillColor('#666666')
               .text(item.description, x, doc.y + 5, {
                   width: width - 20,
                   align: 'justify'
               });
        }

        currentY = doc.y + (isLastItem ? 10 : 15);
    });

    // Add spacing only if not the last section
    return isLast ? currentY : currentY + 20;
}

async function generateStyledCoverLetterPDF(content, outputPath) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4'
        });
        const stream = fs.createWriteStream(outputPath);

        doc.pipe(stream);

        // Subtle header styling
        doc.rect(0, 0, doc.page.width, 40)
           .fill('#f8f9fa');

        doc.moveDown(2);

        // Add paragraphs with proper formatting
        const paragraphs = content.split('\n\n');
        paragraphs.forEach((paragraph, index) => {
            doc.fontSize(11)
               .font('Helvetica')
               .fillColor('#000000')
               .text(paragraph.trim(), {
                   align: 'justify',
                   lineGap: 5
               });

            if (index < paragraphs.length - 1) {
                doc.moveDown(1.5);
            }
        });

        doc.end();
        stream.on('finish', resolve);
        stream.on('error', reject);
    });
}

module.exports = {
    generateDocument,
    generateResume,
    generateCoverLetter,
    generateCoverLetterContent,
    formatDate,
    generateFileName
};