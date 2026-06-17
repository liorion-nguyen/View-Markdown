import { checkPandocAvailable, exportMarkdownToDocx } from './pandoc-export.mjs';

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(new Error('Body JSON không hợp lệ'));
      }
    });
    req.on('error', reject);
  });
}

function createExportHandler() {
  let pandocReady = null;

  return async (req, res, next) => {
    if (req.url !== '/api/export/docx') return next();
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ message: 'Chỉ hỗ trợ POST' }));
      return;
    }

    try {
      pandocReady ??= checkPandocAvailable();
      const available = await pandocReady;
      if (!available) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(
          JSON.stringify({
            message:
              'Pandoc chưa được cài. Chạy: brew install pandoc rồi khởi động lại npm run dev',
          }),
        );
        return;
      }

      const body = await readJsonBody(req);
      const markdown = body.markdown;

      if (!markdown || typeof markdown !== 'string' || !markdown.trim()) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ message: 'Thiếu nội dung markdown' }));
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
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ message: err.message || 'Xuất DOCX thất bại' }));
    }
  };
}

export function pandocExportPlugin() {
  const handler = createExportHandler();

  return {
    name: 'pandoc-export',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
