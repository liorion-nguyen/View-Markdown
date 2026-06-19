import '../../../../../server/config/loadEnv.js';
import { examController } from '../../../../../server/controllers/ExamController.js';
import {
  GEMINI_USER_KEY_ERROR,
  isExamValidationError,
  isUserGeminiKeyRequest,
  resolveAiError,
} from '../../../../../server/utils/aiErrors.js';

export const maxDuration = 120;

export async function POST(request) {
  let body = null;
  try {
    body = await request.json();
    const result = await examController.generate(body);
    return Response.json(result);
  } catch (err) {
    const message = err?.message || 'Tạo đề thất bại';
    if (isExamValidationError(message)) {
      return Response.json({ message }, { status: 400 });
    }
    const useUserKey = isUserGeminiKeyRequest(body);
    const resolved = resolveAiError(err, { useUserKey });
    if (resolved.code === GEMINI_USER_KEY_ERROR) {
      return Response.json(resolved, { status: 422 });
    }
    return Response.json({ code: resolved.code }, { status: 503 });
  }
}
