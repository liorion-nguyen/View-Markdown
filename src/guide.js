/** Quy tắc định dạng — tự ghép khi copy, không hiển thị trên form */
export const FORMAT_RULES = `ĐỊNH DẠNG CHO PHÉP:

【Cấu trúc văn bản — Markdown】
- Tiêu đề đề: # ĐỀ KIỂM TRA ...
- Phần / mục: ## Phần I. Trắc nghiệm, ## Phần II. Tự luận
- Câu hỏi: ### Câu 1, ### Bài 1
- Ngăn cách giữa các câu: ---
- In đậm thông tin: **Thời gian:** 45 phút, **Điểm:** 10
- Bảng đáp án trắc nghiệm dùng bảng Markdown

【Công thức toán — chọn 1 trong các kiểu sau】

1) LaTeX chuẩn:
   - Trong dòng: \\( x^2 + 1 \\), \\( \\frac{3}{4} \\)
   - Riêng dòng:
     \\[
     2x - 5 = 9
     \\]

2) Markdown:
   - Trong dòng: $x^2 + 1$, $\\frac{3}{4}$
   - Riêng dòng:
     $$
     2x - 5 = 9
     $$

3) Dấu ngoặc vuông [ ] (mỗi dấu trên 1 dòng):
     [
     3x - 7 = 11
     ]

4) Ngoặc tròn ( ) cho đáp án / biểu thức ngắn:
   A. (x=2)   B. (\\frac{5}{4})   C. (ABC)

5) Các bước tính (trong khối $$ ... $$), dùng dòng phân cách:
     $$
     \\frac{3}{4}+\\frac{5}{8}
     =======================
     # \\frac{6}{8}+\\frac{5}{8}
     \\frac{11}{8}
     $$

【Ký hiệu toán thường dùng】
- Phân số: \\frac{a}{b}
- Căn: \\sqrt{x}, \\sqrt[3]{x}
- Mũ: x^2, a^{n+1}
- Chỉ số dưới: x_1, a_n
- Nhân: \\cdot hoặc \\times
- Khác: \\pm, \\neq, \\leq, \\geq, \\infty, \\pi
- Hệ phương trình: \\begin{cases} ... \\end{cases}
- Chữ trong công thức: \\text{cm}, \\text{điểm}

【Quy tắc bắt buộc】
- KHÔNG dùng HTML, hình ảnh, hay code block
- Phân số luôn viết \\frac{tử}{mẫu}, không viết 3/4 thuần trong công thức
- Cuối đề phải có phần # Đáp án (bảng TN + lời giải tự luận)`;

export function buildPromptFromForm(data) {
  const lines = [];

  lines.push(`Bạn là giáo viên môn ${data.subject || 'Toán'} lớp ${data.grade || '8'}.`);
  lines.push('');
  lines.push('Hãy soạn đề kiểm tra theo đúng định dạng bên dưới. Chỉ trả về nội dung đề Markdown, không giải thích thêm.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(FORMAT_RULES);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('NỘI DUNG ĐỀ:');

  if (data.time) lines.push(`- Thời gian làm bài: ${data.time}`);
  if (data.totalPoints) lines.push(`- Tổng điểm: ${data.totalPoints}`);

  const examParts = [];
  if (data.includeMc && data.mcCount) {
    examParts.push(`trắc nghiệm ${data.mcCount} câu${data.mcPoints ? ` (${data.mcPoints} điểm)` : ''}`);
  }
  if (data.includeEssay && data.essayCount) {
    examParts.push(`tự luận ${data.essayCount} bài${data.essayPoints ? ` (${data.essayPoints} điểm)` : ''}`);
  }
  if (examParts.length) {
    lines.push(`- Cấu trúc đề: ${examParts.join(' + ')}`);
  }

  if (data.topics?.trim()) {
    lines.push(`- Chủ đề / kiến thức cần kiểm tra: ${data.topics.trim()}`);
  }

  if (data.difficulty?.trim()) {
    lines.push(`- Độ khó: ${data.difficulty.trim()}`);
  }

  if (data.notes?.trim()) {
    lines.push(`- Yêu cầu thêm: ${data.notes.trim()}`);
  }

  return lines.join('\n');
}

export const GUIDE_SECTIONS = [
  {
    title: 'Quy trình 4 bước',
    steps: [
      { label: 'Bước 1', text: 'Điền form bên dưới → bấm Copy prompt (định dạng tự thêm vào).' },
      { label: 'Bước 2', text: 'Dán prompt vào AI, chờ AI soạn đề → copy kết quả Markdown.' },
      { label: 'Bước 3', text: 'Dán vào ô Markdown bên trái, kiểm tra xem trước bên phải.' },
      { label: 'Bước 4', text: 'Bấm Xuất PDF.' },
    ],
  },
  {
    title: 'Mẹo để xuất file đẹp',
    tips: [
      'Mô tả chủ đề càng cụ thể, đề AI soạn càng sát yêu cầu.',
      'Tiêu đề đề nên bắt đầu bằng # để file xuất có tên hợp lý.',
      'PDF giữ layout tốt nhất cho đề thi và tài liệu toán.',
      'Nếu công thức hiện chữ đỏ: kiểm tra thiếu dấu \\ trước frac, sqrt hoặc có ký tự lạ trong khối toán.',
    ],
  },
];
