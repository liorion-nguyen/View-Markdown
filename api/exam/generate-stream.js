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

function writeSse(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Chỉ hỗ trợ POST' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  try {
    for await (const event of examController.generateStream(getBody(req))) {
      if (event.type === 'chunk') {
        writeSse(res, 'chunk', { text: event.text });
      } else if (event.type === 'done') {
        writeSse(res, 'done', { markdown: event.markdown });
      }
    }
    res.end();
  } catch (err) {
    writeSse(res, 'error', { message: err?.message || 'Tạo đề thất bại' });
    res.end();
  }
}
