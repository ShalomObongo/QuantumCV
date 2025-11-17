import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export const getGeminiModel = () => {
  return genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
};

export const cleanAIResponse = (response: string): string => {
  return response
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .replace(/^#.*$/gm, '')
    .replace(/^\s*[\r\n]/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .trim();
};
