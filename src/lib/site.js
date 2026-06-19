/** Cấu hình SEO — đổi NEXT_PUBLIC_SITE_URL khi deploy (VD: https://study.codelab.pro.vn) */
export const site = {
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://md.codelab.pro.vn',
  name: 'CodeLab Study',
  title: 'CodeLab Study — AI tạo đề thi cho giáo viên & học sinh',
  description:
    'Công cụ miễn phí soạn đề kiểm tra bằng AI: đa môn, lớp 6–12, xem trước KaTeX, xuất PDF/DOCX. Dành cho giáo viên và học sinh — từ CodeLab.',
  keywords: [
    'tạo đề thi ai',
    'soạn đề kiểm tra',
    'đề thi trắc nghiệm',
    'giáo viên soạn đề',
    'học sinh luyện đề',
    'codelab study',
    'xuất pdf đề thi',
    'katex',
    'đề kiểm tra lớp 8',
    'đề kiểm tra lớp 9',
  ].join(', '),
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
