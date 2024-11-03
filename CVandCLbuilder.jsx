const gradient = require('gradient-string');
const chalkAnimation = require('chalk-animation');
const terminalLink = require('terminal-link');

const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const PDFDocument = require('pdfkit');
require('dotenv').config();
const chalk = require('chalk');
const ora = require('ora');
const figlet = require('figlet');
const boxen = require('boxen');
const spinner = ora({
    text: 'Processing...',
    color: 'cyan',
    spinner: 'dots'
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Ensure the "Generated cvs" directory exists
const outputDir = path.join(__dirname, 'Generated cvs');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

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

async function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

function getTextFiles() {
    try {
        const files = fs.readdirSync(__dirname)
            .filter(file => file.endsWith('.txt'));
        
        if (files.length === 0) {
            console.log(chalk.yellow('ℹ️  No text files found in the current directory.'));
        }
        return files;
    } catch (error) {
        console.error(chalk.red('Error reading directory:'), error);
        return [];
    }
}

// Input Gathering
async function getInputs(needsJobDescription = false) {
    const textFiles = getTextFiles();
    let resumeText;

    if (textFiles.length > 0) {
        console.log(chalk.cyan.bold('\n📁 AVAILABLE DATA SOURCES:'));
        console.log(chalk.cyan('┌────────────────────────────────────┐'));
        textFiles.forEach((file, index) => {
            console.log(chalk.cyan('│ ') + 
                chalk.green(`[${index + 1}]`) + 
                chalk.white(` ${file}`.padEnd(35)) + 
                chalk.cyan('│')
            );
        });
        console.log(chalk.cyan('│ ') + 
            chalk.green(`[${textFiles.length + 1}]`) + 
            chalk.white(' Manual Data Entry'.padEnd(35)) + 
            chalk.cyan('│')
        );
        console.log(chalk.cyan('└────────────────────────────────────┘'));

        const fileChoice = await askQuestion(chalk.yellow('\nSelect an option: '));
        resumeText = fileChoice <= textFiles.length ?
            fs.readFileSync(path.join(__dirname, textFiles[fileChoice - 1]), 'utf8') :
            await askQuestion(chalk.yellow('Please paste your resume text:\n'));
    } else {
        resumeText = await askQuestion(chalk.yellow('Please paste your resume text:\n'));
    }

    const jobDescription = needsJobDescription ? 
        await askQuestion(chalk.yellow('\nPlease paste the job description:\n')) : 
        null;

    return { resumeText, jobDescription };
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
async function generateResume(resumeText, jobDescription = '', isTailored = false) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    const prompt = buildResumePrompt(resumeText, jobDescription, isTailored);
    
    const result = await model.generateContent(prompt);
    const cleanedResponse = cleanAIResponse(result.response.text());

    try {
        const resumeData = JSON.parse(cleanedResponse);
        const variant = isTailored ? 'tailored' : 'general';
        const pdfPath = path.join(outputDir, generateFileName('resume', variant));
        await generateStyledPDF(resumeData, pdfPath);
        return pdfPath;
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

async function generateDocument(type, resumeText, jobDescription = null) {
    try {
        let pdfPath;
        
        if (type === 'resume') {
            pdfPath = await generateResume(resumeText, jobDescription, !!jobDescription);
        } else if (type === 'cover_letter') {
            const coverLetter = await generateCoverLetterContent(resumeText, jobDescription);
            pdfPath = path.join(outputDir, generateFileName('cover_letter'));
            await generateStyledCoverLetterPDF(coverLetter, pdfPath);
        }
        
        console.log(`\n${type.charAt(0).toUpperCase() + type.slice(1)} generated successfully!`);
        console.log(`Saved as: ${pdfPath}`);
        return pdfPath;
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
                    title: `${edu.school}, ${edu.location} — ${edu.degree}`,
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

// PDF Helper Functions
function addSection(doc, title) {
    doc.moveDown()
       .fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2d3436')
       .text(title)
       .moveTo(doc.x, doc.y)
       .lineTo(doc.x + 495, doc.y)
       .stroke('#d3d3d3')
       .moveDown(0.5);
}

function addExperienceItem(doc, exp, hasMore) {
    doc.circle(60, doc.y + 10, 2)
       .fillAndStroke('#555555');
    
    if (hasMore) {
        doc.moveTo(60, doc.y + 12)
           .lineTo(60, doc.y + 50)
           .stroke('#555555');
    }

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text(exp.company, 75);
    
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text(exp.title, 75);

    doc.fontSize(10)
       .font('Helvetica-Oblique')
       .text(`${exp.date} | ${exp.location} | ${exp.industry}`, 75);

    exp.points.forEach(point => {
        doc.fontSize(10)
           .font('Helvetica')
           .text('•', 85, doc.y)
           .text(point, 100, doc.y - 10);
    });

    if (exp.achievements?.length > 0) {
        doc.moveDown(0.5)
           .font('Helvetica-Bold')
           .text('Key Achievements:', 75);
        
        exp.achievements.forEach(achievement => {
            doc.fontSize(10)
               .font('Helvetica')
               .text('•', 85, doc.y)
               .text(achievement, 100, doc.y - 10);
        });
    }

    doc.moveDown();
}

function addEducationItem(doc, edu) {
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text(edu.school, 75);
    
    doc.fontSize(10)
       .font('Helvetica')
       .text(`${edu.degree}${edu.grade ? ` - ${edu.grade}` : ''}`, 75);
    
    doc.fontSize(10)
       .font('Helvetica-Oblique')
       .text(edu.date, 75);

    if (edu.details) {
        doc.fontSize(10)
           .font('Helvetica')
           .text(edu.details, 75);
    }

    doc.moveDown(0.5);
}

function addProjectsSection(doc, projects) {
    addSection(doc, 'PROJECTS');
    projects.forEach(project => {
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text(project.name, 75);
        
        if (project.role) {
            doc.fontSize(10)
               .font('Helvetica-Oblique')
               .text(project.role, 75);
        }

        doc.fontSize(10)
           .font('Helvetica')
           .text(project.description, 75);

        if (project.technologies?.length > 0) {
            doc.fontSize(10)
               .font('Helvetica-Bold')
               .text('Technologies: ', 75, doc.y, { continued: true })
               .font('Helvetica')
               .text(project.technologies.join(', '));
        }

        if (project.link) {
            doc.fontSize(10)
               .font('Helvetica')
               .text(`Link: ${project.link}`, 75);
        }

        doc.moveDown(0.5);
    });
}

function addSkillsSection(doc, skills) {
    addSection(doc, 'SKILLS');
    
    if (skills.technical?.length > 0) {
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text('Technical Skills:', 75)
           .fontSize(10)
           .font('Helvetica')
           .text(skills.technical.join(', '), 75);
        
        doc.moveDown(0.5);
    }

    if (skills.soft?.length > 0) {
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text('Soft Skills:', 75)
           .fontSize(10)
           .font('Helvetica')
           .text(skills.soft.join(', '), 75);
    }

    doc.moveDown(0.5);
}

function addCertificationsSection(doc, certifications) {
    addSection(doc, 'CERTIFICATIONS');
    certifications.forEach(cert => {
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text(cert.name, 75)
           .fontSize(10)
           .font('Helvetica')
           .text(`${cert.issuer}${cert.date ? ` - ${cert.date}` : ''}`, 75);
        
        doc.moveDown(0.5);
    });
}

function addLanguagesSection(doc, languages) {
    addSection(doc, 'LANGUAGES');
    languages.forEach(lang => {
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .text(lang.language, 75, doc.y, { continued: true })
           .font('Helvetica')
           .text(` - ${lang.level}`);
    });
    doc.moveDown(0.5);
}

function addInterestsSection(doc, interests) {
    addSection(doc, 'INTERESTS');
    doc.fontSize(10)
       .font('Helvetica')
       .text(interests.join(', '), 75);
    doc.moveDown(0.5);
}

// Helper function for animated text
function animateText(text, type = 'rainbow', duration = 2000) {
    return new Promise((resolve) => {
        const animation = chalkAnimation[type](text);
        setTimeout(() => {
            animation.stop();
            resolve();
        }, duration);
    });
}

// Helper function for asking questions
function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

// Helper function for displaying text files
function displayTextFiles(files) {
    console.log(chalk.cyan.bold('\n📁 AVAILABLE DATA SOURCES:'));
    console.log(chalk.cyan('┌────────────────────────────────────┐'));
    files.forEach((file, index) => {
        console.log(chalk.cyan('│ ') + 
            chalk.green(`[${index + 1}]`) + 
            chalk.white(` ${file}`.padEnd(35)) + 
            chalk.cyan('│')
        );
    });
    console.log(chalk.cyan('│ ') + 
        chalk.green(`[${files.length + 1}]`) + 
        chalk.white(' Manual Data Entry'.padEnd(35)) + 
        chalk.cyan('│')
    );
    console.log(chalk.cyan('└────────────────────────────────────┘'));
}

// Helper function for displaying the menu
async function displayMenu() {
    const menuOptions = [
        { key: '1', icon: '🌟', label: 'Generate Quantum Resume/CV' },
        { key: '2', icon: '⚡', label: 'Generate Neural Cover Letter' },
        { key: '3', icon: '🔮', label: 'Generate Full Document Suite' },
        { key: '4', icon: '❌', label: 'Exit System' }
    ];

    console.log(chalk.cyan.bold('\n┌─────────────── AVAILABLE PROTOCOLS ───────────────┐'));
    
    for (const { key, icon, label } of menuOptions) {
        console.log(chalk.white(`│  ${chalk.cyan(key)}  ${icon}  ${chalk.magenta(label)}`));
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log(chalk.cyan.bold('└───────────────────────────────────────────────────┘'));
}

async function displayWelcomeBanner() {
    console.clear();
    
    const banner = figlet.textSync('QUANTUM CV', {
        font: 'ANSI Shadow',
        horizontalLayout: 'fitted'
    });
    
    console.log(chalk.cyan(banner));

    console.log(boxen(
        chalk.cyan(
            '╔══════════════════════════════════════════╗\n' +
            '║     NEXT-GEN DOCUMENT GENERATOR 3000     ║\n' +
            '║──────────────────────────────────────────║\n' +
            '║  Creating tomorrow\'s documents, today.   ║\n' +
            '╚══════════════════════════════════════════╝'
        ),
        {
            padding: 1,
            margin: 1,
            borderStyle: 'double',
            borderColor: 'cyan',
            float: 'center'
        }
    ));
}

// Main function
async function main() {
    try {
        await displayWelcomeBanner();
        console.log('\n' + chalk.cyan('[ SYSTEM INTERFACE INITIALIZED ]'));
        
        await displayMenu();

        const choice = await askQuestion(
            chalk.cyan('\n[SYSTEM]') + 
            chalk.white(' Please select operation protocol ') + 
            chalk.cyan('(1-4): ')
        );

        switch(choice) {
            case '1': {
                await animateText('\n🌟 INITIALIZING RESUME GENERATION PROTOCOL', 'neon');
                const { resumeText, jobDescription } = await getInputs(true);
                const tailorChoice = await askQuestion(
                    chalk.cyan('\n[SYSTEM] ') + 
                    chalk.white('Enable job-specific optimization? (y/n): ')
                );
                
                spinner.start(chalk.cyan('Quantum processing in progress...'));
                await generateDocument('resume', resumeText, tailorChoice.toLowerCase() === 'y' ? jobDescription : null);
                spinner.succeed(chalk.green('Document materialization complete! '));
                break;
            }
            case '2': {
                console.log(chalk.cyan.bold('\n✉️  Cover Letter Generation'));
                const inputs = await getInputs(true);
                
                spinner.start('Generating your cover letter...');
                await generateDocument('cover_letter', inputs.resumeText, inputs.jobDescription);
                spinner.succeed('Cover letter generated successfully!');
                break;
            }
            case '3': {
                console.log(chalk.cyan.bold('\n📚 Complete Package Generation'));
                const { resumeText, jobDescription } = await getInputs(true);
                
                spinner.start('Generating your resume...');
                await generateDocument('resume', resumeText, jobDescription);
                spinner.succeed('Resume generated successfully!');
                
                spinner.start('Generating your cover letter...');
                await generateDocument('cover_letter', resumeText, jobDescription);
                spinner.succeed('Cover letter generated successfully!');
                
                console.log(chalk.green.bold('\n✨ All documents have been generated successfully!'));
                break;
            }
            default:
                console.log(chalk.red('❌ Invalid choice. Please try again.'));
        }
    } catch (error) {
        spinner.fail(chalk.red('⚠ SYSTEM ERROR DETECTED'));
        console.error(
            boxen(chalk.red(error.message), {
                padding: 1,
                margin: 1,
                borderStyle: 'double',
                borderColor: 'red'
            })
        );
    } finally {
        console.log('\n' + chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        await animateText('SYSTEM SHUTDOWN COMPLETE - GOODBYE', 'karaoke');
        rl.close();
    }
}

// Run the program
main().catch(console.error);