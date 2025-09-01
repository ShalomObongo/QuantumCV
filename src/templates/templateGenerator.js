const { GoogleGenerativeAI } = require('@google/generative-ai');

class TemplateGenerator {
    constructor() {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new Error('Google API key not configured');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    }

    async generateCustomTemplate(userPrompt, documentType = 'resume') {
        try {
            const templatePrompt = this.buildTemplatePrompt(userPrompt, documentType);
            
            const result = await this.model.generateContent(templatePrompt);
            const response = await result.response;
            const templateData = response.text();

            // Parse the generated template
            return this.parseGeneratedTemplate(templateData, userPrompt);
        } catch (error) {
            console.error('Template generation error:', error);
            throw new Error('Failed to generate custom template');
        }
    }

    buildTemplatePrompt(userPrompt, documentType) {
        return `You are an expert document template designer. Create a detailed template specification based on the user's requirements.

User Request: "${userPrompt}"
Document Type: ${documentType}

Please create a comprehensive template that includes:

1. Template Metadata:
   - Name (descriptive and professional)
   - Description (what makes this template unique)
   - Target audience/industry
   - Key features

2. Detailed Generation Prompt:
   Create a detailed prompt that will be used by an AI to generate documents using this template. The prompt should:
   - Specify the exact structure and sections to include
   - Define the tone and style of writing
   - Include specific formatting instructions
   - Mention key elements that make this template special
   - Provide guidance for different experience levels
   - Include industry-specific requirements if applicable

3. Template Structure:
   List the main sections this template should include and their purpose

4. Style Guidelines:
   - Tone (professional, creative, technical, etc.)
   - Language style
   - Key phrases or terminology to use
   - Formatting preferences

Respond in the following JSON format:
{
    "name": "Template Name",
    "description": "Brief description of the template",
    "category": "industry/category",
    "targetAudience": "Who this template is designed for",
    "keyFeatures": ["feature 1", "feature 2", "feature 3"],
    "prompt": "Detailed generation prompt for AI to use when creating documents with this template",
    "structure": ["Section 1", "Section 2", "Section 3"],
    "styleGuidelines": {
        "tone": "professional/creative/technical/etc",
        "language": "formal/conversational/technical/etc",
        "keyTerms": ["term1", "term2", "term3"],
        "emphasis": "What to emphasize in this template"
    }
}

Make sure the template is professional, industry-appropriate, and follows best practices for ${documentType} creation.`;
    }

    parseGeneratedTemplate(templateData, userPrompt) {
        try {
            // Try to extract JSON from the response
            let jsonMatch = templateData.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsedTemplate = JSON.parse(jsonMatch[0]);
                
                // Add metadata
                parsedTemplate.id = this.generateTemplateId(parsedTemplate.name);
                parsedTemplate.createdAt = new Date().toISOString();
                parsedTemplate.userPrompt = userPrompt;
                parsedTemplate.isCustom = true;
                
                return parsedTemplate;
            } else {
                // Fallback: create a basic template structure
                return this.createFallbackTemplate(templateData, userPrompt);
            }
        } catch (error) {
            console.error('Template parsing error:', error);
            return this.createFallbackTemplate(templateData, userPrompt);
        }
    }

    createFallbackTemplate(templateData, userPrompt) {
        return {
            id: this.generateTemplateId('Custom Template'),
            name: 'Custom Generated Template',
            description: `Custom template generated based on: "${userPrompt}"`,
            category: 'custom',
            targetAudience: 'General',
            keyFeatures: ['AI-generated', 'Customized content', 'User-specific requirements'],
            prompt: templateData,
            structure: ['Summary', 'Experience', 'Skills', 'Education'],
            styleGuidelines: {
                tone: 'professional',
                language: 'formal',
                keyTerms: [],
                emphasis: 'User requirements'
            },
            createdAt: new Date().toISOString(),
            userPrompt: userPrompt,
            isCustom: true
        };
    }

    generateTemplateId(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50) + '-' + Date.now();
    }

    async generateTemplatePreview(templateId, sampleData) {
        try {
            // This would generate a preview of what the template would look like
            const previewPrompt = `Generate a brief preview/sample of what a document would look like using this template structure. Use placeholder data to show the format and style.

Template ID: ${templateId}
Sample Data: ${JSON.stringify(sampleData)}

Create a short preview showing:
1. How the template structures the content
2. The writing style and tone
3. Key sections and their format
4. Overall presentation style

Keep it concise but representative of the full template.`;

            const result = await this.model.generateContent(previewPrompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Preview generation error:', error);
            return 'Preview not available';
        }
    }
}

module.exports = TemplateGenerator;