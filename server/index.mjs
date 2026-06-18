import './config/loadEnv.js';

import express from 'express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { exportMarkdownToDocx } from '../scripts/pandoc-export.mjs';
import { examController } from './controllers/ExamController.js';

const app = express();
const PORT = Number(process.env.PORT || 4173);
const DIST_DIR = resolve(process.cwd(), 'dist');

app.use(express.json({ limit: '2mb' }));

app.post('/api/exam/generate', async (req, res) => {
  try {
    const result = await examController.generate(req.body);
    res.status(200).json(result);
  } catch (err) {
    const message = err?.message || 'Tạo đề thất bại';
    const status = message.includes('Thiếu') || message.includes('Cần ít nhất') ? 400 : 500;
    res.status(status).json({ message });
  }
});

app.post('/api/exam/generate/stream', async (req, res) => {
  console.log('=== STREAM REQUEST RECEIVED ===', new Date().toISOString());
  console.log('Body:', req.body);

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Quan trọng khi deploy

  try {
    const body = req.body || {};
    if (!body.subject || !body.grade) {
      throw new Error('Thiếu thông tin môn học hoặc khối lớp');
    }

    let eventCount = 0;
    for await (const event of examController.generateStream(body)) {
      eventCount++;
      console.log(`[STREAM] Event ${eventCount}: ${event.type}`);

      if (event.type === 'chunk') {
        res.write(`event: chunk\n`);
        res.write(`data: ${JSON.stringify({ text: event.text })}\n\n`);
      } else if (event.type === 'done') {
        res.write(`event: done\n`);
        res.write(`data: ${JSON.stringify({ markdown: event.markdown })}\n\n`);
      }
    }

    console.log('=== STREAM COMPLETED ===');
    res.end();
  } catch (err) {
    console.error('=== STREAM ERROR ===');
    console.error(err.message);
    console.error(err.stack);

    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ message: err?.message || 'Tạo đề thất bại' })}\n\n`);
    res.end();
  }
});

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
