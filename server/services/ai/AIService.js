import { GeminiProvider } from './providers/GeminiProvider.js';

export class AIService {
  constructor() {
    this.providers = {
      gemini: new GeminiProvider(),
    };
  }

  /**
   * @param {string} prompt
   * @param {{ gemini?: { apiKey?: string, model?: string } }} [options]
   * @returns {Promise<string>}
   */
  async generate(prompt, options = {}) {
    const providerName = process.env.AI_PROVIDER || 'gemini';
    const provider = this.providers[providerName];

    if (!provider) {
      throw new Error(`AI provider không hỗ trợ: ${providerName}`);
    }

    return provider.generate(prompt, options);
  }

  /**
   * @param {string} prompt
   * @param {{ gemini?: { apiKey?: string, model?: string } }} [options]
   * @returns {AsyncGenerator<string>}
   */
  async *generateStream(prompt, options = {}) {
    const providerName = process.env.AI_PROVIDER || 'gemini';
    const provider = this.providers[providerName];

    if (!provider?.generateStream) {
      throw new Error(`AI provider không hỗ trợ streaming: ${providerName}`);
    }

    yield* provider.generateStream(prompt, options);
  }
}

export const aiService = new AIService();
