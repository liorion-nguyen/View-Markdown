/**
 * Cấu hình AI — hỗ trợ nhiều GEMINI_API_KEY cách nhau bởi dấu phẩy
 */
const GEMINI_KEYS = process.env.GEMINI_API_KEY
  ? process.env.GEMINI_API_KEY
      .split(',')
      .map(key => key.trim())
      .filter(key => key.length > 0)
  : [];

// Rotate index (luân phiên)
let currentKeyIndex = 0;

export function getAiConfig() {
  const apiKey = getRandomGeminiKey();   // hoặc dùng getRandomGeminiKey() nếu muốn random

  return {
    provider: process.env.AI_PROVIDER || 'gemini',
    gemini: {
      apiKey: apiKey,
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',        // Nên dùng 1.5-flash để ổn định
      baseUrl:
        process.env.GEMINI_BASE_URL ||
        'https://generativelanguage.googleapis.com/v1beta',
      maxOutputTokens: Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 8192),
      temperature: Number(process.env.GEMINI_TEMPERATURE || 0.7),
    },
  };
}

/** Lấy key theo cơ chế luân phiên (rotate) */
function getNextGeminiKey() {
  if (GEMINI_KEYS.length === 0) {
    return '';
  }
  const key = GEMINI_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length;

  console.log(`[AI Config] Using Gemini Key ${currentKeyIndex + 1}/${GEMINI_KEYS.length}: ${key.substring(0, 15)}...`);
  return key;
}

/** Lấy key ngẫu nhiên (nếu bạn thích kiểu này hơn) */
function getRandomGeminiKey() {
  if (GEMINI_KEYS.length === 0) {
    return '';
  }
  const randomIndex = Math.floor(Math.random() * GEMINI_KEYS.length);
  const key = GEMINI_KEYS[randomIndex];

  console.log(`[AI Config] Using Random Gemini Key: ${key.substring(0, 15)}...`);
  return key;
}