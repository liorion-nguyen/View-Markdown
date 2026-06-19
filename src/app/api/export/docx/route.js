import { exportMarkdownToDocx } from '../../../../../scripts/pandoc-export.mjs';

export const maxDuration = 60;

export async function POST(request) {
  try {
    const body = await request.json();
    const markdown = body?.markdown;

    if (!markdown || typeof markdown !== 'string' || !markdown.trim()) {
      return Response.json({ message: 'Thiếu nội dung markdown' }, { status: 400 });
    }

    const buffer = await exportMarkdownToDocx(markdown);

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Length': String(buffer.length),
      },
    });
  } catch (err) {
    const message = err?.message || 'Xuất DOCX thất bại';
    return Response.json({ message }, { status: 500 });
  }
}
