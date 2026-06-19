import { getAiConfig } from '../../../config/ai.config.js';

function buildRequestBody(prompt, geminiConfig, { stream = false } = {}) {
  const { maxOutputTokens, temperature } = geminiConfig;
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
    if (!trimmed || !trimmed.startsWith('data:')) continue;
    
    const raw = trimmed.slice(5).trim();
    if (!raw || raw === '[DONE]') continue;

    try {
      events.push(JSON.parse(raw));
    } catch (e) {
      console.warn('[Gemini] Parse JSON chunk failed:', raw.substring(0, 100));
      // Không throw để tránh crash toàn bộ stream
    }
  }

  return { events, rest };
}

export class GeminiProvider {
  #resolveConfig(options = {}) {
    const { gemini } = getAiConfig(options);
    return gemini;
  }

  #assertApiKey(geminiConfig) {
    const { apiKey } = geminiConfig;
    if (!apiKey) {
      throw new Error('Chưa cấu hình GEMINI_API_KEY');
    }
    return apiKey;
  }

  #endpoint(geminiConfig, action) {
    const { model, baseUrl } = geminiConfig;
    return `${baseUrl}/models/${model}:${action}`;
  }

  async #handleError(response) {
    let data = {};
    try {
      data = await response.json();
    } catch {}
    
    const apiMessage = data?.error?.message || data?.message || `Gemini API lỗi (${response.status})`;
    console.error('[Gemini] API Error:', apiMessage);
    throw new Error(apiMessage);
  }

  async generate(prompt, options = {}) {
    const geminiConfig = this.#resolveConfig(options);
    const apiKey = this.#assertApiKey(geminiConfig);
    const response = await fetch(this.#endpoint(geminiConfig, 'generateContent'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(buildRequestBody(prompt, geminiConfig)),
    });

    if (!response.ok) await this.#handleError(response);

    const data = await response.json();
    const text = extractChunkText(data).trim();

    if (!text) throw new Error('AI không trả về nội dung');
    return text;
  }

  async *generateStream(prompt, options = {}) {
    console.log('[Gemini] Starting stream... Prompt length:', prompt.length);

    const geminiConfig = this.#resolveConfig(options);
    const apiKey = this.#assertApiKey(geminiConfig);
    const response = await fetch(`${this.#endpoint(geminiConfig, 'streamGenerateContent')}?alt=sse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(buildRequestBody(prompt, geminiConfig, { stream: true })),
    });

    if (!response.ok) await this.#handleError(response);
    if (!response.body) throw new Error('Gemini không hỗ trợ streaming');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const { events, rest } = parseSseBuffer(buffer);
        buffer = rest;

        for (const event of events) {
          const text = extractChunkText(event);
          if (text) {
            console.log(`[Gemini] Chunk: ${text.length} chars`);
            yield text;
          }
        }
      }

      // Xử lý buffer còn lại
      if (buffer.trim()) {
        const { events } = parseSseBuffer(`${buffer}\n`);
        for (const event of events) {
          const text = extractChunkText(event);
          if (text) yield text;
        }
      }

      console.log('[Gemini] Stream completed');
    } catch (err) {
      console.error('[Gemini] Stream error:', err.message);
      throw err;
    } finally {
      reader.releaseLock();
    }
  }
}
