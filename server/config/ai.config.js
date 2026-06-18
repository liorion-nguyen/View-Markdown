/**
 * Cấu hình AI — hỗ trợ nhiều GEMINI_API_KEY cách nhau bởi dấu phẩy
 */

const GEMINI_MODELS = [
  { name: 'gemini-2.5-flash-lite', weight: 60 },   // Rẻ + nhanh nhất
  { name: 'gemini-2.5-flash',      weight: 25 },
  { name: 'gemini-1.5-flash',      weight: 10 },
  { name: 'gemini-3.1-flash-lite', weight: 5 },    // Thử nghiệm
];

const GEMINI_KEYS = process.env.GEMINI_API_KEY
  ? process.env.GEMINI_API_KEY.split(',').map(k => k.trim()).filter(Boolean)
  : [];

export function getAiConfig() {
  const model = getRandomModel();
  const apiKey = getRandomGeminiKey();

  console.log(`[AI Config] 🔑 Key: ${apiKey.substring(0, 15)}... | Model: ${model}`);

  return {
    provider: process.env.AI_PROVIDER || 'gemini',
    gemini: {
      apiKey,
      model,
      baseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
      maxOutputTokens: Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 8192),
      temperature: Number(process.env.GEMINI_TEMPERATURE || 0.7),
    },
  };
}

/** Random model theo trọng số (ưu tiên model rẻ) */
function getRandomModel() {
  const totalWeight = GEMINI_MODELS.reduce((sum, m) => sum + m.weight, 0);
  let random = Math.random() * totalWeight;

  for (const model of GEMINI_MODELS) {
    random -= model.weight;
    if (random <= 0) return model.name;
  }
  return GEMINI_MODELS[0].name; // fallback
}

/** Random key */
function getRandomGeminiKey() {
  if (GEMINI_KEYS.length === 0) return '';
  const idx = Math.floor(Math.random() * GEMINI_KEYS.length);
  return GEMINI_KEYS[idx];
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