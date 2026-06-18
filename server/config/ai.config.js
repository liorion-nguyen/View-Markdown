/**
 * Cấu hình AI — đọc env mỗi lần gọi để tránh bị cache rỗng trước khi load .env
 */
export function getAiConfig() {
  return {
    provider: process.env.AI_PROVIDER || 'gemini',
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      baseUrl:
        process.env.GEMINI_BASE_URL ||
        'https://generativelanguage.googleapis.com/v1beta',
      maxOutputTokens: Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 8192),
      temperature: Number(process.env.GEMINI_TEMPERATURE || 0.7),
    },
  };
}
