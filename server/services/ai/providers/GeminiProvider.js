import { getAiConfig } from '../../../config/ai.config.js';

function buildRequestBody(prompt, { stream = false } = {}) {
  const { maxOutputTokens, temperature } = getAiConfig().gemini;
  return {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens },
  };
}

function extractChunkText(payload) {
  return (
    payload?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('') || ''
  );
}

function parseSseBuffer(buffer) {
  const events = [];
  const lines = buffer.split('\n');
  const rest = lines.pop() ?? '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const raw = trimmed.slice(5).trim();
    if (!raw || raw === '[DONE]') continue;
    try {
      events.push(JSON.parse(raw));
    } catch {
      /* bỏ qua chunk JSON lỗi */
    }
  }

  return { events, rest };
}

export class GeminiProvider {
  #assertApiKey() {
    const { apiKey } = getAiConfig().gemini;
    if (!apiKey) {
      throw new Error(
        'Chưa cấu hình GEMINI_API_KEY. Tạo key tại https://aistudio.google.com/apikey',
      );
    }
    return apiKey;
  }

  #endpoint(action) {
    const { model, baseUrl } = getAiConfig().gemini;
    return `${baseUrl}/models/${model}:${action}`;
  }

  async #handleError(response) {
    const data = await response.json().catch(() => ({}));
    const apiMessage =
      data?.error?.message || data?.message || `Gemini API lỗi (${response.status})`;
    throw new Error(apiMessage);
  }

  /**
   * @param {string} prompt
   * @returns {Promise<string>}
   */
  async generate(prompt) {
    const apiKey = this.#assertApiKey();
    const response = await fetch(this.#endpoint('generateContent'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(buildRequestBody(prompt)),
    });

    if (!response.ok) await this.#handleError(response);

    const data = await response.json();
    const text = extractChunkText(data).trim();

    if (!text) {
      const reason = data?.candidates?.[0]?.finishReason || 'UNKNOWN';
      throw new Error(`AI không trả về nội dung (finishReason: ${reason})`);
    }

    return text;
  }

  /**
   * @param {string} prompt
   * @returns {AsyncGenerator<string>}
   */
  async *generateStream(prompt) {
    const apiKey = this.#assertApiKey();
    const response = await fetch(`${this.#endpoint('streamGenerateContent')}?alt=sse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(buildRequestBody(prompt, { stream: true })),
    });

    if (!response.ok) await this.#handleError(response);
    if (!response.body) throw new Error('Gemini không hỗ trợ streaming');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const { events, rest } = parseSseBuffer(buffer);
      buffer = rest;

      for (const event of events) {
        const text = extractChunkText(event);
        if (text) yield text;
      }
    }

    if (buffer.trim()) {
      const { events } = parseSseBuffer(`${buffer}\n`);
      for (const event of events) {
        const text = extractChunkText(event);
        if (text) yield text;
      }
    }
  }
}
