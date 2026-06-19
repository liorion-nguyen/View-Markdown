/** Cấu hình site — đổi NEXT_PUBLIC_SITE_URL khi deploy (VD: https://md.codelab.pro.vn) */
export const site = {
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://md.codelab.pro.vn',
  name: 'CodeLab Study',
  title: 'CodeLab Study — AI tạo đề thi miễn phí cho giáo viên & học sinh',
  description:
    'Công cụ web miễn phí soạn đề kiểm tra bằng AI Gemini: đa môn Toán, Văn, Anh, Lý, Hóa… lớp 6–12, trắc nghiệm & tự luận, xem trước KaTeX, xuất PDF/DOCX chuẩn in A4. Dành cho giáo viên THCS, THPT và học sinh luyện đề — từ CodeLab.',
  locale: 'vi_VN',
  lang: 'vi',
  themeColor: '#001e40',
  twitterHandle: '@codelab.pro.vn',
  organization: {
    name: 'CodeLab',
    url: 'https://codelab.pro.vn',
    email: 'contact@codelab.pro.vn',
  },
};
