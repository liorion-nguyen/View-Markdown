import { preprocessMarkdown } from '../../../src/preprocess.js';

export class MarkdownService {
  /**
   * Chuẩn hóa markdown từ AI: bỏ code fence, trim, kiểm tra tối thiểu.
   * @param {string} raw
   * @returns {string}
   */
  normalize(raw) {
    if (!raw || typeof raw !== 'string') {
      throw new Error('AI trả về dữ liệu không hợp lệ');
    }

    let text = raw.trim();

    // Bỏ markdown code fence nếu AI bọc kết quả
    text = text.replace(/^```(?:markdown|md)?\s*\n?/i, '');
    text = text.replace(/\n?```\s*$/i, '');
    text = text.trim();

    if (!text) {
      throw new Error('Nội dung markdown trống sau khi chuẩn hóa');
    }

    if (text.length < 80) {
      throw new Error('Nội dung quá ngắn — có thể AI chưa tạo đủ đề');
    }

    return preprocessMarkdown(text);
  }
}

export const markdownService = new MarkdownService();
