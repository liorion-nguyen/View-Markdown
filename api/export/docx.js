import { exportMarkdownToDocx } from '../../scripts/pandoc-export.mjs';

export const config = {
  maxDuration: 60,
};

function getMarkdown(req) {
  const body = req.body;
  if (!body) return '';
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      return parsed?.markdown || '';
    } catch {
      return '';
    }
  }
  return body?.markdown || '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Chỉ hỗ trợ POST' });
    return;
  }

  try {
    const markdown = getMarkdown(req);
    if (!markdown || typeof markdown !== 'string' || !markdown.trim()) {
      res.status(400).json({ message: 'Thiếu nội dung markdown' });
      return;
    }

    const buffer = await exportMarkdownToDocx(markdown);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    res.setHeader('Content-Length', String(buffer.length));
    res.status(200).send(buffer);
  } catch (err) {
    const message = err?.message || 'Xuất DOCX thất bại';
    res.status(500).json({ message });
  }
}
