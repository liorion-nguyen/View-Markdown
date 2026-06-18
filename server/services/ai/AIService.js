import { getAiConfig } from '../../config/ai.config.js';
import { GeminiProvider } from './providers/GeminiProvider.js';

export class AIService {
  constructor() {
    this.providers = {
      gemini: new GeminiProvider(),
    };
  }

  /**
   * @param {string} prompt
   * @returns {Promise<string>}
   */
  async generate(prompt) {
    const providerName = getAiConfig().provider;
    const provider = this.providers[providerName];

    if (!provider) {
      throw new Error(`AI provider không hỗ trợ: ${providerName}`);
    }

    return provider.generate(prompt);
  }

  /**
   * @param {string} prompt
   * @returns {AsyncGenerator<string>}
   */
  async *generateStream(prompt) {
    const providerName = getAiConfig().provider;
    const provider = this.providers[providerName];

    if (!provider?.generateStream) {
      throw new Error(`AI provider không hỗ trợ streaming: ${providerName}`);
    }

    yield* provider.generateStream(prompt);
  }
}

export const aiService = new AIService();
