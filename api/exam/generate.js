import '../../server/config/loadEnv.js';
import { examController } from '../../server/controllers/ExamController.js';

export const config = {
  maxDuration: 120,
};

function getBody(req) {
  const body = req.body;
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Chỉ hỗ trợ POST' });
    return;
  }

  try {
    const result = await examController.generate(getBody(req));
    res.status(200).json(result);
  } catch (err) {
    const message = err?.message || 'Tạo đề thất bại';
    const status = message.includes('Thiếu') || message.includes('Cần ít nhất') ? 400 : 500;
    res.status(status).json({ message });
  }
}
