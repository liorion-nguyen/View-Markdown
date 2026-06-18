import { FORMAT_RULES } from './FormatRules.js';

/**
 * @typedef {Object} ExamRequest
 * @property {string} subject
 * @property {string} grade
 * @property {string} [topic]
 * @property {string} time
 * @property {number} mcCount
 * @property {number} essayCount
 * @property {string} difficulty
 * @property {string} [notes]
 */

export class PromptBuilder {
  isGeographySubject(subject) {
    const normalized = String(subject || '').toLowerCase();
    return normalized.includes('địa lí') || normalized.includes('địa lý');
  }

  wantsCharts(data) {
    const haystack = `${data.topic || ''}\n${data.notes || ''}`.toLowerCase();
    return haystack.includes('biểu đồ') || haystack.includes('chart') || this.isGeographySubject(data.subject);
  }

  /**
   * @param {ExamRequest} data
   * @returns {string}
   */
  build(data) {
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

    if (this.isGeographySubject(data.subject)) {
      lines.push('');
      lines.push('QUY TẮC RIÊNG CHO MÔN ĐỊA LÍ:');
      lines.push('- Phải có ít nhất 1 câu trắc nghiệm đọc biểu đồ và ít nhất 1 bài tự luận phân tích biểu đồ nếu đề có dữ liệu biểu đồ.');
      lines.push('- Mỗi nơi có dữ liệu biểu đồ phải chèn đúng một khối ```chart``` độc lập, không chuyển thành câu văn, không mô tả số liệu bằng \\(\\text{...}\\).');
      lines.push('- Khối chart phải đứng nguyên văn trong đề, ngay sau phần mô tả của câu hỏi hoặc bài tự luận tương ứng.');
      lines.push('- Nếu có số liệu theo năm / theo nhóm / theo khu vực, phải đưa vào labels và data của chart, không viết lại dưới dạng danh sách tiếng Việt thông thường.');
      lines.push('- Ưu tiên dùng type: bar cho so sánh, type: line cho biến động theo thời gian, type: pie cho cơ cấu tỉ trọng.');
      lines.push('- Không dùng "Biểu đồ dưới đây thể hiện nội dung nào?" rồi ghi số liệu bằng câu văn thường. Thay vào đó, phải chèn chart block thật sự.');
      lines.push('- Nếu topic hoặc notes có chữ biểu đồ, đề đầu ra bắt buộc phải có nội dung gắn với chart block, không được chỉ mô tả bằng văn xuôi.');
    }

    if (this.wantsCharts(data)) {
      lines.push('');
      lines.push('MẪU BIỂU ĐỒ BẮT BUỘC KHI CÓ DỮ LIỆU:');
      lines.push('```chart');
      lines.push('type: line');
      lines.push('title: Tên biểu đồ');
      lines.push('labels: Năm 2010 | Năm 2015 | Năm 2020');
      lines.push('data: 20 | 18 | 15');
      lines.push('unit: %');
      lines.push('```');
      lines.push('- Dùng đúng dạng trên cho phần có biểu đồ. Không thay bằng gạch đầu dòng mô tả số liệu như "Năm 2010: ...".');
      lines.push('- Khi ra câu hỏi, phải gắn rõ biểu đồ vào nội dung câu hỏi hoặc bài tự luận để người làm nhìn thấy dữ liệu trực tiếp.');
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
}

export const promptBuilder = new PromptBuilder();
