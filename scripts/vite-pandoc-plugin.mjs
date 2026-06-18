import '../server/config/loadEnv.js';

import { examController } from '../server/controllers/ExamController.js';
import { checkPandocAvailable, exportMarkdownToDocx } from './pandoc-export.mjs';

function readJsonBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolveBody(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(new Error('Body JSON không hợp lệ'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function createExportHandler() {
  let pandocReady = null;

  return async (req, res, next) => {
    if (req.url !== '/api/export/docx') return next();
    if (req.method !== 'POST') {
      sendJson(res, 405, { message: 'Chỉ hỗ trợ POST' });
      return;
    }

    try {
      pandocReady ??= checkPandocAvailable();
      const available = await pandocReady;
      if (!available) {
        sendJson(res, 503, {
          message:
            'Pandoc chưa được cài. Chạy: brew install pandoc rồi khởi động lại npm run dev',
        });
        return;
      }

      const body = await readJsonBody(req);
      const markdown = body.markdown;

      if (!markdown || typeof markdown !== 'string' || !markdown.trim()) {
        sendJson(res, 400, { message: 'Thiếu nội dung markdown' });
        return;
      }

      const buffer = await exportMarkdownToDocx(markdown);
      res.statusCode = 200;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      res.setHeader('Content-Length', buffer.length);
      res.end(buffer);
    } catch (err) {
      sendJson(res, 500, { message: err.message || 'Xuất DOCX thất bại' });
    }
  };
}

function createExamGenerateHandler() {
  return async (req, res, next) => {
    if (req.url !== '/api/exam/generate' && req.url !== '/api/exam/generate/stream') {
      return next();
    }
    if (req.method !== 'POST') {
      sendJson(res, 405, { message: 'Chỉ hỗ trợ POST' });
      return;
    }

    try {
      const body = await readJsonBody(req);

      if (req.url === '/api/exam/generate/stream') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');

        for await (const event of examController.generateStream(body)) {
          if (event.type === 'chunk') {
            res.write(`event: chunk\ndata: ${JSON.stringify({ text: event.text })}\n\n`);
          } else if (event.type === 'done') {
            res.write(`event: done\ndata: ${JSON.stringify({ markdown: event.markdown })}\n\n`);
          }
        }
        res.end();
        return;
      }

      const result = await examController.generate(body);
      sendJson(res, 200, result);
    } catch (err) {
      const message = err?.message || 'Tạo đề thất bại';
      const status = message.includes('Thiếu') || message.includes('Cần ít nhất') ? 400 : 500;

      if (req.url === '/api/exam/generate/stream') {
        res.statusCode = status;
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
        res.end();
        return;
      }

      sendJson(res, status, { message });
    }
  };
}

export function pandocExportPlugin() {
  const exportHandler = createExportHandler();
  const examHandler = createExamGenerateHandler();

  return {
    name: 'pandoc-export',
    configureServer(server) {
      server.middlewares.use(examHandler);
      server.middlewares.use(exportHandler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(examHandler);
      server.middlewares.use(exportHandler);
    },
  };
}
