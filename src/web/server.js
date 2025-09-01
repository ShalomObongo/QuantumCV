require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { generateDocument } = require('../core/documentGenerator');
const { checkAPIConfiguration } = require('../core/apiConfig');
const { templates, coverLetterTemplates, getAllTemplates, getAllCoverLetterTemplates } = require('../templates/templateLibrary');
const TemplateGenerator = require('../templates/templateGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure the "Generated cvs" directory exists
const outputDir = path.join(__dirname, '../../Generated cvs');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Ensure temp directory exists
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        cb(null, `resume_${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['text/plain', 'application/pdf'];
        const allowedExtensions = ['.txt', '.pdf'];
        
        if (allowedTypes.includes(file.mimetype) || 
            allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext))) {
            cb(null, true);
        } else {
            cb(new Error('Only .txt and .pdf files are allowed'), false);
        }
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get('/api/health', async (req, res) => {
    const apiStatus = await checkAPIConfiguration();
    res.json({ 
        status: 'OK', 
        message: 'QuantumCV API is running',
        apiConfigured: apiStatus.configured,
        apiMessage: apiStatus.message
    });
});

app.get('/api/config', async (req, res) => {
    const apiStatus = await checkAPIConfiguration();
    res.json(apiStatus);
});

app.post('/api/generate', upload.single('resumeFile'), async (req, res) => {
    try {
        // Check API configuration first
        const apiStatus = await checkAPIConfiguration();
        if (!apiStatus.configured) {
            return res.status(500).json({ 
                error: 'API not configured',
                message: 'Please configure your Google API key in the .env file'
            });
        }

        const { resumeText, jobDescription, documentType, tailored } = req.body;
        
        let resumeData = resumeText;
        
        // If a file was uploaded, read its content
        if (req.file) {
            if (req.file.mimetype === 'application/pdf') {
                // Handle PDF files
                const pdfBuffer = fs.readFileSync(req.file.path);
                const pdfData = await pdfParse(pdfBuffer);
                resumeData = pdfData.text;
            } else {
                // Handle text files
                resumeData = fs.readFileSync(req.file.path, 'utf8');
            }
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
        }
        
        if (!resumeData || resumeData.trim().length === 0) {
            return res.status(400).json({ error: 'Resume text or file is required' });
        }

        // Generate document based on type
        const isTailored = tailored === 'true' && jobDescription && jobDescription.trim().length > 0;
        const result = await generateDocument(
            documentType, 
            resumeData, 
            isTailored ? jobDescription : null, 
            outputDir
        );

        res.json({
            success: true,
            fileName: result.fileName,
            downloadUrl: `/api/download/${result.fileName}`,
            message: `${documentType.charAt(0).toUpperCase() + documentType.slice(1)} generated successfully!`
        });
    } catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate document',
            message: error.message 
        });
    }
});

app.post('/api/generate-suite', upload.single('resumeFile'), async (req, res) => {
    try {
        // Check API configuration first
        const apiStatus = await checkAPIConfiguration();
        if (!apiStatus.configured) {
            return res.status(500).json({ 
                error: 'API not configured',
                message: 'Please configure your Google API key in the .env file'
            });
        }

        const { resumeText, jobDescription } = req.body;
        
        let resumeData = resumeText;
        
        // If a file was uploaded, read its content
        if (req.file) {
            if (req.file.mimetype === 'application/pdf') {
                // Handle PDF files
                const pdfBuffer = fs.readFileSync(req.file.path);
                const pdfData = await pdfParse(pdfBuffer);
                resumeData = pdfData.text;
            } else {
                // Handle text files
                resumeData = fs.readFileSync(req.file.path, 'utf8');
            }
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
        }
        
        if (!resumeData || resumeData.trim().length === 0) {
            return res.status(400).json({ error: 'Resume text or file is required' });
        }

        if (!jobDescription || jobDescription.trim().length === 0) {
            return res.status(400).json({ error: 'Job description is required for document suite generation' });
        }

        // Generate both resume and cover letter
        const resumeResult = await generateDocument('resume', resumeData, jobDescription, outputDir);
        const coverLetterResult = await generateDocument('cover_letter', resumeData, jobDescription, outputDir);

        res.json({
            success: true,
            documents: [
                {
                    type: 'resume',
                    fileName: resumeResult.fileName,
                    downloadUrl: `/api/download/${resumeResult.fileName}`
                },
                {
                    type: 'cover_letter',
                    fileName: coverLetterResult.fileName,
                    downloadUrl: `/api/download/${coverLetterResult.fileName}`
                }
            ],
            message: 'Document suite generated successfully!'
        });
    } catch (error) {
        console.error('Suite generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate document suite',
            message: error.message 
        });
    }
});

app.get('/api/download/:filename', (req, res) => {
    const fileName = req.params.filename;
    const filePath = path.join(outputDir, fileName);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }
    
    res.download(filePath, fileName, (err) => {
        if (err) {
            console.error('Download error:', err);
            res.status(500).json({ error: 'Failed to download file' });
        }
    });
});

app.get('/api/files', (req, res) => {
    try {
        const files = fs.readdirSync(outputDir)
            .filter(file => file.endsWith('.pdf'))
            .map(file => {
                const stats = fs.statSync(path.join(outputDir, file));
                return {
                    name: file,
                    size: stats.size,
                    created: stats.birthtime,
                    downloadUrl: `/api/download/${file}`
                };
            })
            .sort((a, b) => new Date(b.created) - new Date(a.created));
        
        res.json({ files });
    } catch (error) {
        console.error('Error listing files:', error);
        res.status(500).json({ error: 'Failed to list files' });
    }
});

// Template endpoints
app.get('/api/templates', (req, res) => {
    try {
        const { category, type } = req.query;
        
        if (type === 'cover-letter') {
            res.json({ 
                templates: getAllCoverLetterTemplates(),
                type: 'cover-letter'
            });
        } else {
            let templateList = getAllTemplates();
            
            if (category) {
                templateList = Object.entries(templateList)
                    .filter(([key, template]) => template.category === category)
                    .reduce((acc, [key, template]) => {
                        acc[key] = template;
                        return acc;
                    }, {});
            }
            
            res.json({ 
                templates: templateList,
                type: 'resume'
            });
        }
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

app.get('/api/templates/categories', (req, res) => {
    try {
        const categories = [...new Set(Object.values(getAllTemplates()).map(t => t.category))];
        res.json({ categories });
    } catch (error) {
        console.error('Error fetching template categories:', error);
        res.status(500).json({ error: 'Failed to fetch template categories' });
    }
});

app.post('/api/templates/custom', async (req, res) => {
    try {
        const apiStatus = await checkAPIConfiguration();
        if (!apiStatus.configured) {
            return res.status(500).json({ 
                error: 'API not configured',
                message: 'Please configure your Google API key in the .env file'
            });
        }

        const { prompt, documentType = 'resume' } = req.body;
        
        if (!prompt || prompt.trim().length === 0) {
            return res.status(400).json({ error: 'Template description prompt is required' });
        }

        const templateGenerator = new TemplateGenerator();
        const customTemplate = await templateGenerator.generateCustomTemplate(prompt, documentType);
        
        res.json({
            success: true,
            template: customTemplate,
            message: 'Custom template generated successfully!'
        });
    } catch (error) {
        console.error('Custom template generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate custom template',
            message: error.message 
        });
    }
});

app.post('/api/generate/preview', upload.single('resumeFile'), async (req, res) => {
    try {
        const apiStatus = await checkAPIConfiguration();
        if (!apiStatus.configured) {
            return res.status(500).json({ 
                error: 'API not configured',
                message: 'Please configure your Google API key in the .env file'
            });
        }

        const { resumeText, jobDescription, documentType, templateId, customTemplate } = req.body;
        
        let resumeData = resumeText;
        
        // If a file was uploaded, read its content
        if (req.file) {
            if (req.file.mimetype === 'application/pdf') {
                const pdfBuffer = fs.readFileSync(req.file.path);
                const pdfData = await pdfParse(pdfBuffer);
                resumeData = pdfData.text;
            } else {
                resumeData = fs.readFileSync(req.file.path, 'utf8');
            }
            fs.unlinkSync(req.file.path);
        }
        
        if (!resumeData || resumeData.trim().length === 0) {
            return res.status(400).json({ error: 'Resume text or file is required' });
        }

        // Get the template prompt
        let templatePrompt = '';
        if (customTemplate) {
            const template = JSON.parse(customTemplate);
            templatePrompt = template.prompt;
        } else if (templateId) {
            const template = documentType === 'cover_letter' ? coverLetterTemplates[templateId] : templates[templateId];
            if (template) {
                templatePrompt = template.prompt;
            }
        }

        // Generate preview using the document generator with preview mode
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        let prompt = '';
        if (documentType === 'cover_letter') {
            prompt = `Create a professional cover letter preview based on the following information:

Resume/Background: ${resumeData}
${jobDescription ? `Job Description: ${jobDescription}` : ''}
${templatePrompt ? `Template Guidelines: ${templatePrompt}` : ''}

Generate a preview of the cover letter content (first 3-4 paragraphs) showing how it would be structured and written. Include placeholder sections like [Your Name], [Company Name], etc. where appropriate.`;
        } else {
            prompt = `Create a professional resume preview based on the following information:

Resume Data: ${resumeData}
${jobDescription ? `Target Job: ${jobDescription}` : ''}
${templatePrompt ? `Template Guidelines: ${templatePrompt}` : ''}

Generate a preview showing the structure and content of the resume. Include the main sections (summary, experience, skills, education) with sample content based on the provided data. Keep it concise but representative of the full document.`;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const previewContent = response.text();

        res.json({
            success: true,
            preview: previewContent,
            documentType: documentType,
            templateUsed: templateId || 'custom'
        });
    } catch (error) {
        console.error('Preview generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate preview',
            message: error.message 
        });
    }
});

app.post('/api/generate/template', upload.single('resumeFile'), async (req, res) => {
    try {
        const apiStatus = await checkAPIConfiguration();
        if (!apiStatus.configured) {
            return res.status(500).json({ 
                error: 'API not configured',
                message: 'Please configure your Google API key in the .env file'
            });
        }

        const { resumeText, jobDescription, documentType, templateId, customTemplate, tailored } = req.body;
        
        let resumeData = resumeText;
        
        // If a file was uploaded, read its content
        if (req.file) {
            if (req.file.mimetype === 'application/pdf') {
                const pdfBuffer = fs.readFileSync(req.file.path);
                const pdfData = await pdfParse(pdfBuffer);
                resumeData = pdfData.text;
            } else {
                resumeData = fs.readFileSync(req.file.path, 'utf8');
            }
            fs.unlinkSync(req.file.path);
        }
        
        if (!resumeData || resumeData.trim().length === 0) {
            return res.status(400).json({ error: 'Resume text or file is required' });
        }

        // Get the template prompt
        let templatePrompt = '';
        if (customTemplate) {
            const template = JSON.parse(customTemplate);
            templatePrompt = template.prompt;
        } else if (templateId) {
            const template = documentType === 'cover_letter' ? coverLetterTemplates[templateId] : templates[templateId];
            if (template) {
                templatePrompt = template.prompt;
            }
        }

        // Generate document with template
        const isTailored = tailored === 'true' && jobDescription && jobDescription.trim().length > 0;
        const result = await generateDocument(
            documentType, 
            resumeData, 
            isTailored ? jobDescription : null, 
            outputDir,
            templatePrompt
        );

        res.json({
            success: true,
            fileName: result.fileName,
            downloadUrl: `/api/download/${result.fileName}`,
            message: `${documentType.charAt(0).toUpperCase() + documentType.slice(1)} generated successfully with template!`,
            templateUsed: templateId || 'custom'
        });
    } catch (error) {
        console.error('Template generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate document with template',
            message: error.message 
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large' });
        }
    }
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🚀 QuantumCV Web Server running at http://localhost:${PORT}`);
    console.log(`📊 API Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🌐 Open your browser to start generating documents!`);
});

module.exports = app;