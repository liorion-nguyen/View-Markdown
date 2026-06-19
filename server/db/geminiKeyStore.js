import { createHash } from 'node:crypto';

import { neon } from '@neondatabase/serverless';

/** @type {string[]} */
let cachedPoolKeys = [];
let initPromise = null;

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    ''
  );
}

function hashApiKey(apiKey) {
  return createHash('sha256').update(apiKey).digest('hex');
}

function keyHint(apiKey) {
  if (apiKey.length <= 8) return '***';
  return `…${apiKey.slice(-4)}`;
}

function getSql() {
  const url = getDatabaseUrl();
  if (!url) return null;
  return neon(url);
}

async function ensureSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS gemini_api_keys (
      id BIGSERIAL PRIMARY KEY,
      key_hash CHAR(64) NOT NULL UNIQUE,
      api_key TEXT NOT NULL,
      key_hint VARCHAR(16) NOT NULL,
      source VARCHAR(32) NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      success_count INT NOT NULL DEFAULT 1
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS gemini_api_keys_last_verified_idx
    ON gemini_api_keys (last_verified_at DESC)
  `;
}

async function loadPoolKeys(sql) {
  const rows = await sql`
    SELECT api_key
    FROM gemini_api_keys
    ORDER BY last_verified_at DESC
  `;
  cachedPoolKeys = rows.map((row) => row.api_key).filter(Boolean);
}

/**
 * Khởi tạo bảng + nạp cache key từ DB (idempotent).
 * @returns {Promise<boolean>} true nếu DB sẵn sàng
 */
export async function initGeminiKeyStore() {
  const sql = getSql();
  if (!sql) {
    cachedPoolKeys = [];
    return false;
  }

  await ensureSchema(sql);
  await loadPoolKeys(sql);
  return true;
}

/** @returns {Promise<void>} */
export function ensureGeminiKeyStoreReady() {
  if (!getDatabaseUrl()) return Promise.resolve();
  if (!initPromise) {
    initPromise = initGeminiKeyStore().catch((err) => {
      initPromise = null;
      console.error('[GeminiKeyStore] Init failed:', err?.message || err);
      return false;
    });
  }
  return initPromise.then(() => undefined);
}

/** Key pool đã xác minh — dùng cho random server key */
export function getCachedGeminiPoolKeys() {
  return cachedPoolKeys;
}

/**
 * Sau khi user key gọi Gemini thành công: kiểm tra trùng (hash) rồi thêm/cập nhật.
 * @param {string} apiKey
 */
export async function registerVerifiedUserKey(apiKey) {
  const trimmed = String(apiKey || '').trim();
  if (!trimmed) return { saved: false, reason: 'empty' };

  const sql = getSql();
  if (!sql) return { saved: false, reason: 'no_database' };

  await ensureGeminiKeyStoreReady();

  const key_hash = hashApiKey(trimmed);
  const hint = keyHint(trimmed);

  const existing = await sql`
    SELECT id FROM gemini_api_keys WHERE key_hash = ${key_hash} LIMIT 1
  `;

  if (existing.length > 0) {
    await sql`
      UPDATE gemini_api_keys
      SET
        last_verified_at = NOW(),
        success_count = success_count + 1
      WHERE key_hash = ${key_hash}
    `;
    return { saved: false, reason: 'exists', keyHint: hint };
  }

  await sql`
    INSERT INTO gemini_api_keys (key_hash, api_key, key_hint, source)
    VALUES (${key_hash}, ${trimmed}, ${hint}, 'user')
  `;

  if (!cachedPoolKeys.includes(trimmed)) {
    cachedPoolKeys.unshift(trimmed);
  }

  console.log(`[GeminiKeyStore] Registered verified user key ${hint}`);
  return { saved: true, keyHint: hint };
}

/** Ghi nhận key thành công — không chặn response nếu DB lỗi */
export function trackVerifiedUserKey(apiKey) {
  registerVerifiedUserKey(apiKey).catch((err) => {
    console.error('[GeminiKeyStore] track failed:', err?.message || err);
  });
}
