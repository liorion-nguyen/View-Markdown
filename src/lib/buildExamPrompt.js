import { FORMAT_RULES } from './format-rules.js';

function isGeographySubject(subject) {
  const normalized = String(subject || '').toLowerCase();
  return normalized.includes('địa lí') || normalized.includes('địa lý');
}

function wantsCharts(data) {
  const haystack = `${data.topic || ''}\n${data.notes || ''}`.toLowerCase();
  return haystack.includes('biểu đồ') || haystack.includes('chart') || isGeographySubject(data.subject);
}

/**
 * @param {{
 *   subject: string;
 *   grade: string;
 *   topic?: string;
 *   time?: string;
 *   mcCount: number;
 *   essayCount: number;
 *   difficulty?: string;
 *   notes?: string;
 * }} data
 * @returns {string}
 */
export function buildExamPrompt(data) {
  const lines = [];

  lines.push(
    `Bạn là giáo viên môn ${data.subject || 'Toán'} lớp ${data.grade || '8'}.`,
  );
  lines.push('');
  lines.push(
    'Hãy soạn đề kiểm tra theo ĐÚNG MỘT định dạng quy định bên dưới — không dùng cách viết khác (không $, không thụt lề khối toán, không HTML).',
  );
  lines.push(
    'Chỉ trả về nội dung đề Markdown thuần, không giải thích thêm, không bọc trong code fence. Nếu môn Địa lý cần biểu đồ, dùng khối ```chart``` cố định theo quy tắc bên dưới.',
  );

  if (isGeographySubject(data.subject)) {
    lines.push('');
    lines.push('QUY TẮC RIÊNG CHO MÔN ĐỊA LÍ:');
    lines.push('- Phải có ít nhất 1 câu trắc nghiệm đọc biểu đồ và ít nhất 1 bài tự luận phân tích biểu đồ nếu đề có dữ liệu biểu đồ.');
    lines.push('- Mỗi nơi có dữ liệu biểu đồ phải chèn đúng một khối ```chart``` độc lập.');
  }

  if (wantsCharts(data)) {
    lines.push('');
    lines.push('MẪU BIỂU ĐỒ BẮT BUỘC KHI CÓ DỮ LIỆU:');
    lines.push('```chart');
    lines.push('type: line');
    lines.push('title: Tên biểu đồ');
    lines.push('labels: Năm 2010 | Năm 2015 | Năm 2020');
    lines.push('data: 20 | 18 | 15');
    lines.push('unit: %');
    lines.push('```');
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(FORMAT_RULES);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('NỘI DUNG ĐỀ:');

  if (data.time?.trim()) {
    lines.push(`- Thời gian làm bài: ${data.time.trim()}`);
  } else {
    lines.push('- KHÔNG ghi thời gian làm bài trên đề');
  }

  if (data.mcCount > 0) {
    lines.push(`- Có phần trắc nghiệm: ${data.mcCount} câu`);
  } else {
    lines.push('- KHÔNG tạo phần trắc nghiệm (Phần I)');
  }

  if (data.essayCount > 0) {
    lines.push(`- Có phần tự luận: ${data.essayCount} bài`);
  } else {
    lines.push('- KHÔNG tạo phần tự luận (Phần II)');
  }

  if (data.topic?.trim()) {
    lines.push(`- Chuyên đề / kiến thức: ${data.topic.trim()}`);
  }

  if (data.difficulty?.trim()) {
    lines.push(`- Độ khó: ${data.difficulty.trim()}`);
  }

  if (data.notes?.trim()) {
    lines.push('- Yêu cầu bổ sung:');
    for (const note of data.notes.split('\n- ').filter(Boolean)) {
      lines.push(`  - ${note.trim()}`);
    }
  }

  return lines.join('\n');
}
