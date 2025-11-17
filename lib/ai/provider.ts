import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

/**
 * AI Provider with fallback support
 * Tries Gemini first, falls back to Groq if Gemini fails
 */

// Available Groq models:
// - llama-3.3-70b-versatile (70B parameters, general purpose)
// - llama-3.1-8b-instant (8B parameters, fast)
// - mixtral-8x7b-32768 (47B parameters, large context)
// - gemma2-9b-it (9B parameters, instruction-tuned)
// User requested: Use large model for better quality

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-pro-latest';

interface AIResponse {
  text: string;
  provider: 'gemini' | 'groq';
}

export class AIProvider {
  private geminiClient: GoogleGenerativeAI | null = null;
  private groqClient: Groq | null = null;
  private geminiAvailable: boolean = false;
  private groqAvailable: boolean = false;

  constructor() {
    // Initialize Gemini if API key is available
    if (process.env.GOOGLE_API_KEY) {
      try {
        this.geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        this.geminiAvailable = true;
        console.log('✓ Gemini AI initialized');
      } catch (error) {
        console.warn('⚠ Gemini initialization failed:', error);
      }
    }

    // Initialize Groq if API key is available
    if (process.env.GROQ_API_KEY) {
      try {
        this.groqClient = new Groq({
          apiKey: process.env.GROQ_API_KEY,
        });
        this.groqAvailable = true;
        console.log(`✓ Groq AI initialized (model: ${GROQ_MODEL})`);
      } catch (error) {
        console.warn('⚠ Groq initialization failed:', error);
      }
    }

    if (!this.geminiAvailable && !this.groqAvailable) {
      console.error('❌ No AI providers available. Set GOOGLE_API_KEY or GROQ_API_KEY in environment variables.');
    }
  }

  /**
   * Generate content with automatic fallback
   * Tries Gemini first, falls back to Groq if it fails
   */
  async generateContent(prompt: string): Promise<AIResponse> {
    let lastError: Error | null = null;

    // Try Gemini first
    if (this.geminiAvailable && this.geminiClient) {
      try {
        console.log('🚀 Attempting generation with Gemini...');
        const model = this.geminiClient.getGenerativeModel({ model: GEMINI_MODEL });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log('✓ Gemini generation successful');
        return { text, provider: 'gemini' };
      } catch (error: any) {
        lastError = error;
        console.warn('⚠ Gemini failed:', error.message);
        console.log('🔄 Falling back to Groq...');
      }
    }

    // Fallback to Groq
    if (this.groqAvailable && this.groqClient) {
      try {
        console.log(`🚀 Attempting generation with Groq (${GROQ_MODEL})...`);
        const completion = await this.groqClient.chat.completions.create({
          model: GROQ_MODEL,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 8000,
          top_p: 1,
        });

        const text = completion.choices[0]?.message?.content || '';
        if (!text) {
          throw new Error('Groq returned empty response');
        }
        console.log('✓ Groq generation successful');
        return { text, provider: 'groq' };
      } catch (error: any) {
        lastError = error;
        console.error('❌ Groq failed:', error.message);
      }
    }

    // Both providers failed
    throw new Error(
      `All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Check which providers are available
   */
  getAvailableProviders(): string[] {
    const providers: string[] = [];
    if (this.geminiAvailable) providers.push('gemini');
    if (this.groqAvailable) providers.push('groq');
    return providers;
  }

  /**
   * Get the primary provider (first available)
   */
  getPrimaryProvider(): 'gemini' | 'groq' | null {
    if (this.geminiAvailable) return 'gemini';
    if (this.groqAvailable) return 'groq';
    return null;
  }
}

// Singleton instance
let aiProviderInstance: AIProvider | null = null;

/**
 * Get or create AI provider instance
 */
export function getAIProvider(): AIProvider {
  if (!aiProviderInstance) {
    aiProviderInstance = new AIProvider();
  }
  return aiProviderInstance;
}

/**
 * Clean AI response (remove markdown formatting, etc.)
 */
export function cleanAIResponse(response: string): string {
  return response
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .replace(/^#.*$/gm, '')
    .replace(/^\s*[\r\n]/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .trim();
}

/**
 * Legacy function for backward compatibility with existing code
 * @deprecated Use getAIProvider().generateContent() instead
 */
export function getGeminiModel() {
  const provider = getAIProvider();
  return {
    generateContent: async (prompt: string) => {
      const response = await provider.generateContent(prompt);
      return {
        response: {
          text: () => response.text,
        },
      };
    },
  };
}
