export const AI_PUBLIC_ERROR = 'AI_SERVICE_UNAVAILABLE';
export const GEMINI_USER_KEY_ERROR = 'GEMINI_USER_KEY_ERROR';

export function isExamValidationError(message) {
  const msg = String(message || '');
  return msg.includes('Thiếu') || msg.includes('Cần ít nhất');
}

/** @param {unknown} body */
export function isUserGeminiKeyRequest(body) {
  return Boolean(String(body?.geminiApiKey || '').trim());
}

/** Không trả raw message từ Gemini/API ra client (trừ khi dùng key riêng). */
export function sanitizeAiError(err) {
  console.error('[AI Error]', err?.message || err);
  return AI_PUBLIC_ERROR;
}

/**
 * Chuyển lỗi Gemini sang thông báo tiếng Việt — chỉ dùng khi người dùng gửi key riêng.
 * @param {unknown} err
 */
export function formatGeminiUserError(err) {
  const raw = String(err?.message || err || '').trim();
  const lower = raw.toLowerCase();

  if (!raw) {
    return 'Gemini từ chối yêu cầu. Kiểm tra API key và thử lại.';
  }

  if (
    lower.includes('api key not valid') ||
    lower.includes('api_key_invalid') ||
    lower.includes('invalid api key')
  ) {
    return 'API key không hợp lệ. Kiểm tra lại key tại Google AI Studio hoặc tạo key mới.';
  }

  if (
    lower.includes('quota') ||
    lower.includes('resource has been exhausted') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests')
  ) {
    return 'API key đã hết quota hoặc vượt giới hạn tần suất. Thử lại sau hoặc kiểm tra hạn mức tại Google AI Studio.';
  }

  if (
    lower.includes('permission') ||
    lower.includes('forbidden') ||
    lower.includes('access denied') ||
    lower.includes('blocked') ||
    lower.includes('not enabled')
  ) {
    return 'API key bị từ chối quyền truy cập — có thể bị chặn vùng, chưa bật Generative Language API, hoặc key bị vô hiệu hóa.';
  }

  if (lower.includes('billing') || lower.includes('payment')) {
    return 'Tài khoản Google Cloud liên kết với key cần bật billing hoặc đã vượt hạn mức thanh toán.';
  }

  if (lower.includes('not found') && lower.includes('model')) {
    return 'Model Gemini không khả dụng với key này. Thử lại sau hoặc đổi key khác.';
  }

  if (lower.includes('user location is not supported')) {
    return 'Gemini không hỗ trợ khu vực của bạn với API key này.';
  }

  const clean = raw.replace(/AIza[\w-]+/gi, '***').slice(0, 320);
  return clean || 'Gemini từ chối yêu cầu. Kiểm tra API key và thử lại.';
}

/**
 * @param {unknown} err
 * @param {{ useUserKey?: boolean }} [options]
 * @returns {{ code: string, message?: string }}
 */
export function resolveAiError(err, { useUserKey = false } = {}) {
  const message = String(err?.message || '');

  if (isExamValidationError(message)) {
    return { code: message, message };
  }

  if (useUserKey) {
    return {
      code: GEMINI_USER_KEY_ERROR,
      message: formatGeminiUserError(err),
    };
  }

  return { code: sanitizeAiError(err) };
}
