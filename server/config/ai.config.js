/**
 * Cấu hình AI — hỗ trợ nhiều GEMINI_API_KEY cách nhau bởi dấu phẩy
 * + key đã xác minh từ DB (Neon)
 */

import { getCachedGeminiPoolKeys } from '../db/geminiKeyStore.js';

/** Trọng số model: 2.5-lite 60%, hai model còn lại mỗi cái 20% (6:2:2) */
const MODEL_WEIGHT_BY_NAME = {
  'gemini-2.5-flash-lite': 6,
  'gemini-2.5-flash': 2,
  'gemini-3.1-flash-lite': 2,
};

const DEFAULT_MODEL_POOL = [
  { name: 'gemini-2.5-flash-lite', weight: 6 },
  { name: 'gemini-2.5-flash', weight: 2 },
  { name: 'gemini-3.1-flash-lite', weight: 2 },
];

const GEMINI_KEYS = process.env.GEMINI_API_KEY
  ? process.env.GEMINI_API_KEY.split(',').map((k) => k.trim()).filter(Boolean)
  : [];

/** GEMINI_MODEL=gemini-2.5-flash-lite hoặc nhiều model cách nhau dấu phẩy */
const ENV_MODELS = process.env.GEMINI_MODEL
  ? process.env.GEMINI_MODEL.split(',').map((m) => m.trim()).filter(Boolean)
  : [];

const DEFAULT_MODEL = 'gemini-2.5-flash-lite';

function getModelPool() {
  if (ENV_MODELS.length === 0) return DEFAULT_MODEL_POOL;

  return ENV_MODELS.map((name) => ({
    name,
    weight: MODEL_WEIGHT_BY_NAME[name] ?? 2,
  }));
}

function pickWeighted(pool) {
  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of pool) {
    random -= item.weight;
    if (random <= 0) return item.name ?? item.key;
  }

  return pool[0].name ?? pool[0].key;
}

function pickModel() {
  return pickWeighted(getModelPool());
}

/**
 * @param {{ gemini?: { apiKey?: string, model?: string } }} [overrides]
 */
export function getAiConfig(overrides = {}) {
  const userKey = overrides.gemini?.apiKey?.trim();
  const apiKey = userKey || getRandomGeminiKey();
  const model = overrides.gemini?.model?.trim() || (userKey ? DEFAULT_MODEL : pickModel());

  if (apiKey && !userKey) {
    console.log(`[AI Config] Key: ${apiKey.slice(0, 10)}... | Model: ${model}`);
  } else if (userKey) {
    console.log(`[AI Config] User API key | Model: ${model}`);
  }

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

/** Random đều giữa key env + key đã xác minh trong DB */
function getRandomGeminiKey() {
  const pool = [...new Set([...GEMINI_KEYS, ...getCachedGeminiPoolKeys()])];
  if (pool.length === 0) return '';
  return pool[Math.floor(Math.random() * pool.length)];
}
