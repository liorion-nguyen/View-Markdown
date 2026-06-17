/** Cấu hình SEO — đổi VITE_SITE_URL khi deploy (VD: https://study.codelab.pro.vn) */
export const site = {
  url: process.env.VITE_SITE_URL || 'https://md.codelab.pro.vn',
  name: 'CodeLab Study',
  title: 'CodeLab Study — Tạo đề thi và tài liệu toán bằng AI',
  description:
    'Công cụ miễn phí xem trước Markdown toán học (KaTeX), soạn đề thi với AI và xuất PDF. Dành cho giáo viên, học sinh THCS — từ CodeLab.',
  keywords: [
    'markdown toán',
    'đề thi toán',
    'katex',
    'xuất pdf đề thi',
    'soạn đề ai',
    'codelab study',
    'công thức toán',
    'latex online',
    'đề kiểm tra toán lớp 8',
    'giáo viên toán',
  ].join(', '),
  locale: 'vi_VN',
  lang: 'vi',
  themeColor: '#1e3a5f',
  twitterHandle: '@codelab.pro.vn',
  organization: {
    name: 'CodeLab',
    url: 'https://codelab.pro.vn',
    email: 'contact@codelab.pro.vn',
  },
};
