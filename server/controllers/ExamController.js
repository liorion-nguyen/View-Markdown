import { ensureGeminiKeyStoreReady, trackVerifiedUserKey } from '../db/geminiKeyStore.js';
import { promptBuilder } from '../services/prompt/PromptBuilder.js';
import { aiService } from '../services/ai/AIService.js';
import { markdownService } from '../services/markdown/MarkdownService.js';

/**
 * @param {unknown} body
 * @returns {{ examRequest: import('../services/prompt/PromptBuilder.js').ExamRequest, aiOptions: { gemini?: { apiKey: string } }, userGeminiApiKey: string }}
 */
function parseGenerateRequest(body) {
  const examRequest = parseExamRequest(body);
  const userGeminiApiKey = String(body?.geminiApiKey || '').trim();
  const aiOptions = userGeminiApiKey ? { gemini: { apiKey: userGeminiApiKey } } : {};
  return { examRequest, aiOptions, userGeminiApiKey };
}

/**
 * @param {unknown} body
 * @returns {import('../services/prompt/PromptBuilder.js').ExamRequest}
 */
function parseExamRequest(body) {
  const mcCount = Math.max(0, Number(body?.mcCount ?? 0) || 0);
  const essayCount = Math.max(0, Number(body?.essayCount ?? 0) || 0);

  if (mcCount === 0 && essayCount === 0) {
    throw new Error('Cần ít nhất 1 câu trắc nghiệm hoặc 1 bài tự luận');
  }

  const subject = String(body?.subject || '').trim();
  const grade = String(body?.grade || '').trim();
  const time = String(body?.time || '').trim();

  if (!subject) throw new Error('Thiếu môn học');
  if (!grade) throw new Error('Thiếu khối lớp');

  return {
    subject,
    grade,
    topic: String(body?.topic || '').trim(),
    time,
    mcCount,
    essayCount,
    difficulty: String(body?.difficulty || 'Cơ bản').trim(),
    notes: String(body?.notes || '').trim(),
  };
}

function onUserKeyVerified(userGeminiApiKey, body) {
  if (!userGeminiApiKey) return;
  if (body?.isPrivate === true || body?.isPrivate === 'true') {
    console.log('[GeminiKeyStore] Private key detected. Skipping database saving.');
    return;
  }
  trackVerifiedUserKey(userGeminiApiKey);
}

export class ExamController {
  /**
   * @param {unknown} body
   * @returns {Promise<{ markdown: string }>}
   */
  async generate(body) {
    await ensureGeminiKeyStoreReady();

    const { examRequest, aiOptions, userGeminiApiKey } = parseGenerateRequest(body);
    const prompt = promptBuilder.build(examRequest);
    const rawMarkdown = await aiService.generate(prompt, aiOptions);
    const markdown = markdownService.normalize(rawMarkdown);

    onUserKeyVerified(userGeminiApiKey, body);

    return { markdown };
  }

  /**
   * @param {unknown} body
   * @returns {AsyncGenerator<{ type: 'chunk', text: string } | { type: 'done', markdown: string }>}
   */
  async *generateStream(body) {
    await ensureGeminiKeyStoreReady();

    const { examRequest, aiOptions, userGeminiApiKey } = parseGenerateRequest(body);
    const prompt = promptBuilder.build(examRequest);

    let full = '';
    for await (const chunk of aiService.generateStream(prompt, aiOptions)) {
      full += chunk;
      yield { type: 'chunk', text: chunk };
    }

    const markdown = markdownService.normalize(full);
    onUserKeyVerified(userGeminiApiKey, body);
    yield { type: 'done', markdown };
  }
}

export const examController = new ExamController();
