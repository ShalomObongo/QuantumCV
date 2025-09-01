require('dotenv').config();

// API Configuration Check
async function checkAPIConfiguration() {
    if (!process.env.GOOGLE_API_KEY) {
        return {
            configured: false,
            message: 'Google API key not configured'
        };
    }
    
    try {
        // Test API connection with a simple request
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
        
        // Simple test to verify API key is valid
        await model.generateContent("Test");
        
        return {
            configured: true,
            message: 'API configuration valid'
        };
    } catch (error) {
        return {
            configured: false,
            message: 'Invalid API key or connection failed'
        };
    }
}

module.exports = {
    checkAPIConfiguration
};