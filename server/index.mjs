import express from 'express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { exportMarkdownToDocx } from '../scripts/pandoc-export.mjs';

const app = express();
const PORT = Number(process.env.PORT || 4173);
const DIST_DIR = resolve(process.cwd(), 'dist');

app.use(express.json({ limit: '2mb' }));

app.post('/api/export/docx', async (req, res) => {
  try {
    const markdown = req.body?.markdown;
    if (!markdown || typeof markdown !== 'string' || !markdown.trim()) {
      res.status(400).json({ message: 'Thiếu nội dung markdown' });
      return;
    }

    const buffer = await exportMarkdownToDocx(markdown);
    res.status(200);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    res.setHeader('Content-Length', String(buffer.length));
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: err?.message || 'Xuất DOCX thất bại' });
  }
});

if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (_req, res) => {
    res.sendFile(resolve(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running at http://localhost:${PORT}`);
});
