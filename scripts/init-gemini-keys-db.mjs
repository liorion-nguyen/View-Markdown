#!/usr/bin/env node
/**
 * Khởi tạo bảng gemini_api_keys trên Neon (chạy một lần nếu cần).
 * Usage: node scripts/init-gemini-keys-db.mjs
 */
import '../server/config/loadEnv.js';
import { initGeminiKeyStore } from '../server/db/geminiKeyStore.js';

const ok = await initGeminiKeyStore();
if (!ok) {
  console.error('Thiếu DATABASE_URL trong .env');
  process.exit(1);
}

console.log('Bảng gemini_api_keys đã sẵn sàng.');
