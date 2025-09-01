const templates = {
    professional: {
        name: "Professional Executive",
        description: "Clean, modern design perfect for corporate positions and executive roles",
        category: "corporate",
        preview: "Professional layout with clear sections, executive summary focus",
        prompt: `Create a highly professional, executive-level resume with the following structure:
        - Executive Summary highlighting key achievements and leadership experience
        - Core Competencies section with key skills
        - Professional Experience with quantified achievements and impact
        - Education and Certifications
        - Use strong action verbs and emphasize results and metrics
        - Maintain a formal, authoritative tone throughout
        - Format for easy ATS scanning with clear section headers`
    },
    
    creative: {
        name: "Creative Professional",
        description: "Modern, visually appealing design for creative industries",
        category: "creative",
        preview: "Creative layout with portfolio emphasis and visual elements",
        prompt: `Design a creative professional resume with these elements:
        - Creative Summary showcasing artistic vision and creative achievements
        - Portfolio/Projects section highlighting key creative works
        - Technical Skills including software and creative tools
        - Professional Experience emphasizing creative projects and collaborations
        - Education and relevant workshops/certifications
        - Use dynamic language that reflects creativity and innovation
        - Include metrics for creative impact (views, engagement, awards)
        - Balance creativity with professionalism`
    },
    
    technical: {
        name: "Software Engineer",
        description: "Technical-focused template for developers and engineers",
        category: "technical",
        preview: "Code-focused layout with technical skills and project emphasis",
        prompt: `Build a technical resume optimized for software engineering roles:
        - Technical Summary highlighting programming expertise and system design experience
        - Technical Skills section organized by category (Languages, Frameworks, Tools, Databases)
        - Projects section with technical details, technologies used, and impact
        - Professional Experience focusing on technical contributions and system improvements
        - Education and relevant certifications
        - Include GitHub/portfolio links and open source contributions
        - Emphasize problem-solving abilities and technical achievements
        - Use technical terminology appropriately`
    },
    
    academic: {
        name: "Academic & Research",
        description: "Research-focused template for academic positions",
        category: "academic",
        preview: "Academic CV format with research, publications, and teaching focus",
        prompt: `Create an academic CV with comprehensive research focus:
        - Academic Profile summarizing research interests and scholarly achievements
        - Education with dissertation/thesis details and academic honors
        - Research Experience with detailed project descriptions and methodologies
        - Publications section (peer-reviewed articles, conference papers, books)
        - Grants and Funding received
        - Teaching Experience and course development
        - Conference Presentations and invited talks
        - Professional Service and committee work
        - Use formal academic language and emphasize scholarly contributions`
    },
    
    sales: {
        name: "Sales & Marketing",
        description: "Results-driven template for sales and marketing professionals",
        category: "sales",
        preview: "Achievement-focused layout emphasizing numbers and results",
        prompt: `Develop a sales-focused resume highlighting performance and results:
        - Sales Profile emphasizing track record of exceeding targets and revenue generation
        - Key Achievements section with specific sales metrics and percentages
        - Professional Experience with quantified sales results, territory growth, and client relationships
        - Core Sales Skills including CRM systems, sales methodologies, and industry knowledge
        - Education and sales certifications
        - Awards and Recognition for sales performance
        - Use action-oriented language with strong emphasis on numbers and percentages
        - Highlight relationship-building and negotiation skills`
    },
    
    healthcare: {
        name: "Healthcare Professional",
        description: "Medical and healthcare industry focused template",
        category: "healthcare",
        preview: "Clinical layout with certifications and patient care emphasis",
        prompt: `Create a healthcare professional resume with clinical focus:
        - Professional Summary highlighting patient care experience and clinical expertise
        - Clinical Skills and Competencies including procedures and specializations
        - Professional Experience emphasizing patient outcomes and clinical achievements
        - Education including medical degree, residency, and continuing education
        - Licenses and Certifications with renewal dates
        - Research and Publications if applicable
        - Professional Memberships and affiliations
        - Use healthcare-specific terminology and emphasize patient care quality
        - Include any quality improvement initiatives or clinical research`
    },
    
    startup: {
        name: "Startup & Entrepreneurial",
        description: "Dynamic template for startup environments and entrepreneurs",
        category: "startup",
        preview: "Agile layout emphasizing innovation, growth, and adaptability",
        prompt: `Build an entrepreneurial resume for startup environments:
        - Entrepreneurial Summary highlighting innovation, adaptability, and growth mindset
        - Key Projects and Ventures including startups founded or early-stage involvement
        - Professional Experience emphasizing rapid growth, pivoting, and multi-role capabilities
        - Technical and Business Skills relevant to startup environments
        - Education and relevant entrepreneurship programs
        - Achievements including funding raised, user growth, or product launches
        - Use dynamic language reflecting agility, innovation, and problem-solving
        - Emphasize ability to work in fast-paced, uncertain environments`
    },
    
    consulting: {
        name: "Management Consulting",
        description: "Strategic template for consulting and advisory roles",
        category: "consulting",
        preview: "Strategy-focused layout with client impact and analytical skills",
        prompt: `Design a consulting-focused resume emphasizing strategic thinking:
        - Professional Summary highlighting analytical skills and client impact
        - Core Consulting Skills including frameworks, analytical tools, and industry knowledge
        - Professional Experience with client success stories and strategic outcomes
        - Case Study Highlights showing problem-solving approach and results
        - Education including MBA or relevant analytical qualifications
        - Certifications in consulting methodologies or industry-specific areas
        - Speaking Engagements and thought leadership
        - Use consulting terminology and emphasize strategic thinking and client value
        - Include metrics on cost savings, revenue generation, or process improvements`
    }
};

const coverLetterTemplates = {
    standard: {
        name: "Professional Standard",
        description: "Classic professional cover letter format",
        prompt: `Write a professional cover letter with this structure:
        - Opening paragraph expressing interest in the specific position
        - Body paragraphs highlighting relevant experience and achievements
        - Closing paragraph with call to action and next steps
        - Maintain professional tone throughout
        - Customize for the specific company and role`
    },
    
    creative: {
        name: "Creative Industry",
        description: "Engaging cover letter for creative roles",
        prompt: `Craft a creative cover letter that:
        - Opens with a compelling hook related to the creative field
        - Showcases creative thinking and artistic vision
        - Highlights creative projects and their impact
        - Demonstrates understanding of the creative industry
        - Maintains professionalism while showing personality`
    },
    
    technical: {
        name: "Technical Role",
        description: "Technical cover letter for engineering positions",
        prompt: `Create a technical cover letter focusing on:
        - Technical expertise and relevant programming languages
        - Specific projects that demonstrate technical skills
        - Problem-solving approach and systematic thinking
        - Understanding of technical challenges in the industry
        - Collaboration and communication in technical environments`
    }
};

module.exports = {
    templates,
    coverLetterTemplates,
    getTemplate: (templateId) => templates[templateId],
    getCoverLetterTemplate: (templateId) => coverLetterTemplates[templateId],
    getAllTemplates: () => templates,
    getAllCoverLetterTemplates: () => coverLetterTemplates,
    getTemplatesByCategory: (category) => {
        return Object.entries(templates).filter(([key, template]) => 
            template.category === category
        ).reduce((acc, [key, template]) => {
            acc[key] = template;
            return acc;
        }, {});
    }
};