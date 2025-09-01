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
function buildResumePrompt(resumeText, jobDescription, isTailored, templatePrompt = null) {
    let prompt = '';
    
    if (templatePrompt) {
        // Use custom template prompt
        prompt = `${templatePrompt}

Resume Data:
${resumeText}

${jobDescription ? `Job Description for targeting:
${jobDescription}` : ''}

Please create a professional resume following the template guidelines above. Return the result as a valid JSON object with the following structure:
{
    "contact": {
        "name": "Full Name",
        "email": "email@example.com",
        "phone": "phone number",
        "location": "City, State",
        "linkedin": "linkedin URL",
        "github": "github URL (if applicable)"
    },
    "summary": "Professional summary paragraph",
    "experience": [
        {
            "company": "Company Name",
            "position": "Job Title",
            "duration": "Start Date - End Date",
            "responsibilities": ["responsibility 1", "responsibility 2", "responsibility 3"]
        }
    ],
    "skills": ["skill 1", "skill 2", "skill 3"],
    "education": [
        {
            "institution": "School Name",
            "degree": "Degree Type",
            "field": "Field of Study",
            "year": "Year",
            "details": "Relevant details (optional)"
        }
    ],
    "certifications": ["certification 1", "certification 2"] (optional),
    "projects": [
        {
            "name": "Project Name",
            "description": "Brief description",
            "technologies": ["tech 1", "tech 2"]
        }
    ] (optional)
}`;
    } else {
        // Use default prompts
        prompt = isTailored ? 
            `Create a highly tailored professional resume from the following text and job description.
            
IMPORTANT: Return ONLY a valid JSON object with this structure:
{
    "contact": {
        "name": "Full Name",
        "email": "email@example.com",
        "phone": "phone number",
        "location": "City, State",
        "linkedin": "linkedin URL",
        "github": "github URL (if applicable)"
    },
    "summary": "Professional summary paragraph",
    "experience": [
        {
            "company": "Company Name",
            "position": "Job Title", 
            "duration": "Start Date - End Date",
            "responsibilities": ["responsibility 1", "responsibility 2", "responsibility 3"]
        }
    ],
    "skills": ["skill 1", "skill 2", "skill 3"],
    "education": [
        {
            "institution": "School Name",
            "degree": "Degree Type",
            "field": "Field of Study", 
            "year": "Year",
            "details": "Relevant details (optional)"
        }
    ],
    "certifications": ["certification 1", "certification 2"] (optional),
    "projects": [
        {
            "name": "Project Name",
            "description": "Brief description",
            "technologies": ["tech 1", "tech 2"]
        }
    ] (optional)
}

Resume:
${resumeText}

Job Description:
${jobDescription}` : 
            `Create a professional resume from the following text. Return ONLY a valid JSON object with this structure:
{
    "contact": {
        "name": "Full Name",
        "email": "email@example.com", 
        "phone": "phone number",
        "location": "City, State",
        "linkedin": "linkedin URL",
        "github": "github URL (if applicable)"
    },
    "summary": "Professional summary paragraph",
    "experience": [
        {
            "company": "Company Name",
            "position": "Job Title",
            "duration": "Start Date - End Date", 
            "responsibilities": ["responsibility 1", "responsibility 2", "responsibility 3"]
        }
    ],
    "skills": ["skill 1", "skill 2", "skill 3"],
    "education": [
        {
            "institution": "School Name",
            "degree": "Degree Type",
            "field": "Field of Study",
            "year": "Year",
            "details": "Relevant details (optional)"
        }
    ],
    "certifications": ["certification 1", "certification 2"] (optional),
    "projects": [
        {
            "name": "Project Name", 
            "description": "Brief description",
            "technologies": ["tech 1", "tech 2"]
        }
    ] (optional)
}

Resume:
${resumeText}`;
    }

    return prompt;
}

function buildCoverLetterPrompt(resumeText, jobDescription, templatePrompt = null) {
    if (templatePrompt) {
        return `${templatePrompt}

Resume/Background Information:
${resumeText}

Job Description:
${jobDescription}

Please create a professional cover letter following the template guidelines above.`;
    }
    
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
async function generateResume(resumeText, jobDescription = '', isTailored = false, outputDir, templatePrompt = null) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const prompt = buildResumePrompt(resumeText, jobDescription, isTailored, templatePrompt);
    
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

async function generateCoverLetterContent(resumeText, jobDescription, templatePrompt = null) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const prompt = buildCoverLetterPrompt(resumeText, jobDescription, templatePrompt);
    
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

async function generateCoverLetter(resumeText, jobDescription, outputDir, templatePrompt = null) {
    const content = await generateCoverLetterContent(resumeText, jobDescription, templatePrompt);
    const fileName = generateFileName('cover_letter');
    const pdfPath = path.join(outputDir, fileName);
    await generateStyledCoverLetterPDF(content, pdfPath);
    return { pdfPath, fileName, content };
}

async function generateDocument(type, resumeText, jobDescription = null, outputDir, templatePrompt = null) {
    try {
        if (type === 'resume') {
            return await generateResume(resumeText, jobDescription, !!jobDescription, outputDir, templatePrompt);
        } else if (type === 'cover_letter') {
            return await generateCoverLetter(resumeText, jobDescription, outputDir, templatePrompt);
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
        
        try {
            // Header with contact info
            doc.fontSize(24).fillColor('#2563eb').text(resumeData.contact.name, { align: 'center' });
            doc.fontSize(10).fillColor('#666666');
            
            let contactInfo = [];
            if (resumeData.contact.email) contactInfo.push(resumeData.contact.email);
            if (resumeData.contact.phone) contactInfo.push(resumeData.contact.phone);
            if (resumeData.contact.location) contactInfo.push(resumeData.contact.location);
            
            doc.text(contactInfo.join(' | '), { align: 'center' });
            
            if (resumeData.contact.linkedin || resumeData.contact.github) {
                let links = [];
                if (resumeData.contact.linkedin) links.push(resumeData.contact.linkedin);
                if (resumeData.contact.github) links.push(resumeData.contact.github);
                doc.text(links.join(' | '), { align: 'center' });
            }
            
            doc.moveDown(1);
            
            // Professional Summary
            if (resumeData.summary) {
                doc.fontSize(14).fillColor('#1f2937').text('PROFESSIONAL SUMMARY', { underline: true });
                doc.moveDown(0.5);
                doc.fontSize(10).fillColor('#374151').text(resumeData.summary);
                doc.moveDown(1);
            }
            
            // Experience
            if (resumeData.experience && resumeData.experience.length > 0) {
                doc.fontSize(14).fillColor('#1f2937').text('PROFESSIONAL EXPERIENCE', { underline: true });
                doc.moveDown(0.5);
                
                resumeData.experience.forEach(exp => {
                    doc.fontSize(12).fillColor('#1f2937').text(`${exp.position} - ${exp.company}`, { continued: true });
                    doc.fontSize(10).fillColor('#666666').text(` (${exp.duration})`, { align: 'right' });
                    doc.moveDown(0.3);
                    
                    if (exp.responsibilities && exp.responsibilities.length > 0) {
                        exp.responsibilities.forEach(resp => {
                            doc.fontSize(10).fillColor('#374151').text(`• ${resp}`, { indent: 20 });
                        });
                    }
                    doc.moveDown(0.5);
                });
            }
            
            // Skills
            if (resumeData.skills && resumeData.skills.length > 0) {
                doc.fontSize(14).fillColor('#1f2937').text('SKILLS', { underline: true });
                doc.moveDown(0.5);
                doc.fontSize(10).fillColor('#374151').text(resumeData.skills.join(' • '));
                doc.moveDown(1);
            }
            
            // Education
            if (resumeData.education && resumeData.education.length > 0) {
                doc.fontSize(14).fillColor('#1f2937').text('EDUCATION', { underline: true });
                doc.moveDown(0.5);
                
                resumeData.education.forEach(edu => {
                    doc.fontSize(12).fillColor('#1f2937').text(`${edu.degree} in ${edu.field || 'N/A'}`, { continued: true });
                    doc.fontSize(10).fillColor('#666666').text(` (${edu.year})`, { align: 'right' });
                    doc.fontSize(10).fillColor('#374151').text(edu.institution);
                    if (edu.details) {
                        doc.text(edu.details);
                    }
                    doc.moveDown(0.5);
                });
            }
            
            // Projects
            if (resumeData.projects && resumeData.projects.length > 0) {
                doc.fontSize(14).fillColor('#1f2937').text('PROJECTS', { underline: true });
                doc.moveDown(0.5);
                
                resumeData.projects.forEach(project => {
                    doc.fontSize(12).fillColor('#1f2937').text(project.name);
                    doc.fontSize(10).fillColor('#374151').text(project.description);
                    if (project.technologies && project.technologies.length > 0) {
                        doc.fillColor('#666666').text(`Technologies: ${project.technologies.join(', ')}`);
                    }
                    doc.moveDown(0.5);
                });
            }
            
            // Certifications
            if (resumeData.certifications && resumeData.certifications.length > 0) {
                doc.fontSize(14).fillColor('#1f2937').text('CERTIFICATIONS', { underline: true });
                doc.moveDown(0.5);
                resumeData.certifications.forEach(cert => {
                    doc.fontSize(10).fillColor('#374151').text(`• ${cert}`);
                });
                doc.moveDown(1);
            }
            
            doc.end();
            
            stream.on('finish', () => {
                resolve(outputPath);
            });
        } catch (error) {
            reject(error);
        }
    });
}

async function generateStyledCoverLetterPDF(content, outputPath) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4'
        });
        const stream = fs.createWriteStream(outputPath);
        
        doc.pipe(stream);
        
        try {
            doc.fontSize(12).fillColor('#374151').text(content, {
                align: 'left',
                lineGap: 2
            });
            
            doc.end();
            
            stream.on('finish', () => {
                resolve(outputPath);
            });
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generateDocument,
    generateResume,
    generateCoverLetter,
    generateStyledPDF,
    generateStyledCoverLetterPDF
};