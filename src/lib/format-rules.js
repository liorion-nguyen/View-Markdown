/** Quy tắc định dạng markdown — dùng chung client & server */
export const FORMAT_RULES = `ĐỊNH DẠNG BẮT BUỘC (chỉ dùng đúng như sau — không thay bằng cách khác):

【1. Markdown】
- Tiêu đề đề: # ĐỀ KIỂM TRA ...
- Phần: ## Phần I. Trắc nghiệm / ## Phần II. Tự luận
- Câu hỏi: ### Câu 1 / ### Bài 1
- Ý phụ: a) b) c) — mỗi ý một dòng
- Trắc nghiệm: A. B. C. D. — mỗi phương án một dòng
- Liệt kê lời giải: dùng bullet - (mỗi ý một dòng)
- Ngăn cách câu: ---
- Cuối đề: # Đáp án (bảng TN + lời giải tự luận)
- KHÔNG dùng HTML, hình ảnh, code block, bảng ngoài bảng đáp án TN

【2. Công thức — chỉ LaTeX với \\( \\) và \\[ \\]】
- Trong dòng (ngắn, nằm giữa câu): \\( ... \\)
- Riêng dòng (công thức dài, nhiều bước): \\[ ... \\]
- CẤM dùng $, $$, công thức Unicode, hoặc ngoặc ( ) thay cho LaTeX
- Phân số: \\frac{tử}{mẫu}; đơn vị: \\text{ g}, \\text{ mol}, \\text{ L}
- Hình học: \\( \\Delta ABC \\), \\( \\angle ABC \\), \\( \\sim \\), \\( \\cong \\)

【3. Biểu đồ Địa lý — chỉ dùng khối chart cố định】
- Khi cần biểu đồ, dùng đúng khối sau và không dùng HTML tự do
- Các trường bắt buộc: type, title, labels, data
- type chỉ nhận: bar, line, pie
- labels và data viết trên một dòng, ngăn cách bằng |
- data là số; ưu tiên dấu chấm cho số thập phân để tránh nhầm với dấu tách

Ví dụ đúng:
\`\`\`chart
type: bar
title: Dân số một số thành phố
labels: Hà Nội | Hải Phòng | Đà Nẵng | TP.HCM
data: 8.2 | 2.1 | 1.2 | 9.1
unit: triệu người
\`\`\`

- Nếu là bài Địa lý có yêu cầu biểu đồ, phải ưu tiên khối chart này thay vì vẽ bằng HTML, bảng tự do hoặc ảnh chèn ngoài

【4. Vị trí khối \\[ ... \\] — quan trọng】
- \\[ và \\] phải ở ĐẦU DÒNG (cột 0), KHÔNG thụt lề, KHÔNG nằm trong bullet -
- Luôn có MỘT dòng trống trước \\[ và sau \\]
- Trong bullet cần công thức dài: kết thúc dòng bullet bằng dấu :, xuống dòng trống, rồi mới viết \\[ ... \\] ở đầu dòng

【5. Các bước tính / giải phương trình】
- Gộp TẤT CẢ bước trong MỘT khối \\[ ... \\] duy nhất
- Mỗi bước một dòng; dòng sau bắt đầu bằng \\Leftrightarrow hoặc \\Rightarrow

【6. Lời giải tự luận】
- Mỗi câu lập luận một dòng; chỉ tiếng Việt
- Chỉ MỘT lời giải đúng; không thử nhiều cách, không ghi (Lỗi:...), không tự sửa lại

【7. Đầu ra】
- Chỉ trả về Markdown thuần
- Không giải thích, không bọc code fence, không thêm text ngoài đề`;
