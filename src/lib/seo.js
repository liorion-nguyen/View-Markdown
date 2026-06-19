import { site } from '@/lib/site';

/** Nhóm từ khóa SEO — gộp khi cần meta keywords & nội dung ẩn cho crawler */
export const keywordGroups = {
  brand: [
    'codelab study',
    'codelab pro',
    'codelab tạo đề',
    'codelab giáo dục',
    'md.codelab.pro.vn',
  ],
  ai: [
    'tạo đề thi ai',
    'tạo đề kiểm tra ai',
    'ai soạn đề thi',
    'ai tạo đề thi miễn phí',
    'trợ lý ai giáo viên',
    'ai ra đề trắc nghiệm',
    'gemini tạo đề thi',
    'google ai studio đề thi',
    'chatgpt tạo đề kiểm tra',
    'ứng dụng ai soạn đề',
  ],
  exam: [
    'soạn đề kiểm tra',
    'ra đề thi online',
    'làm đề kiểm tra',
    'đề thi trắc nghiệm',
    'đề thi tự luận',
    'ma trận đề thi',
    'đề kiểm tra 15 phút',
    'đề kiểm tra 1 tiết',
    'đề giữa kỳ',
    'đề cuối kỳ',
    'đề ôn tập',
    'bộ đề kiểm tra',
    'ngân hàng câu hỏi',
    'bảng đáp án',
    'lời giải chi tiết',
  ],
  audience: [
    'giáo viên soạn đề',
    'công cụ ra đề giáo viên',
    'phần mềm ra đề thi miễn phí',
    'học sinh luyện đề',
    'tự luyện đề thi',
    'học sinh tự tạo đề',
    'giáo viên THCS',
    'giáo viên THPT',
  ],
  grade: [
    'đề kiểm tra lớp 6',
    'đề kiểm tra lớp 7',
    'đề kiểm tra lớp 8',
    'đề kiểm tra lớp 9',
    'đề kiểm tra lớp 10',
    'đề kiểm tra lớp 11',
    'đề kiểm tra lớp 12',
    'đề thi THCS',
    'đề thi THPT',
    'đề kiểm tra lớp 6 7 8 9',
    'đề kiểm tra lớp 10 11 12',
  ],
  subject: [
    'đề kiểm tra toán',
    'đề kiểm tra ngữ văn',
    'đề kiểm tra tiếng anh',
    'đề kiểm tra vật lý',
    'đề kiểm tra hóa học',
    'đề kiểm tra sinh học',
    'đề kiểm tra lịch sử',
    'đề kiểm tra địa lý',
    'đề kiểm tra gdcd',
    'đề kiểm tra tin học',
    'đề kiểm tra công nghệ',
    'đề kiểm tra đa môn',
  ],
  export: [
    'xuất pdf đề thi',
    'xuất word đề thi',
    'xuất docx đề kiểm tra',
    'in đề thi a4',
    'tải đề thi pdf',
    'chuyển đề sang word',
  ],
  tech: [
    'katex công thức toán',
    'markdown đề thi',
    'xem trước đề thi',
    'công thức toán học online',
    'soạn đề markdown',
  ],
  intent: [
    'tạo đề nhanh',
    'tạo đề miễn phí không cần đăng ký',
    'web tạo đề thi online',
    'công cụ kiểm tra học sinh',
    'phần mềm soạn đề không cần cài đặt',
    'tạo đề theo chương trình sgk',
    'đề thi chuẩn sư phạm',
  ],
};

export function allKeywords() {
  return [...new Set(Object.values(keywordGroups).flat())];
}

const OG_IMAGE = {
  url: '/logo-codelab.png',
  width: 1200,
  height: 630,
  alt: `${site.name} — AI tạo đề thi cho giáo viên & học sinh`,
};

/** Metadata riêng từng route */
export const pageSeo = {
  home: {
    path: '/',
    title: site.title,
    description: site.description,
    keywords: [
      ...keywordGroups.brand,
      ...keywordGroups.ai,
      ...keywordGroups.exam,
      ...keywordGroups.audience,
      ...keywordGroups.intent,
    ],
    ogAlt: 'CodeLab Study — Nền tảng AI tạo đề kiểm tra miễn phí',
  },
  workspace: {
    path: '/workspace',
    title: 'Tạo đề bằng AI — Soạn đề kiểm tra trực tuyến | CodeLab Study',
    description:
      'Tạo đề kiểm tra bằng AI Gemini: chọn môn, khối lớp 6–12, số câu trắc nghiệm/tự luận, chủ đề và độ khó. AI soạn đề theo thời gian thực, xem trước KaTeX, xuất PDF/DOCX — miễn phí cho giáo viên và học sinh.',
    keywords: [
      ...keywordGroups.ai,
      ...keywordGroups.exam,
      ...keywordGroups.grade,
      ...keywordGroups.subject,
      'tạo đề bằng ai online',
      'gemini soạn đề thi',
      'ai tạo đề trắc nghiệm',
    ],
    ogAlt: 'Màn hình tạo đề kiểm tra bằng AI — CodeLab Study',
  },
  compose: {
    path: '/compose',
    title: 'Tạo đề thủ công — Prompt ChatGPT/Gemini & xuất PDF | CodeLab Study',
    description:
      'Tạo đề kiểm tra thủ công: điền form, sao chép prompt chuẩn sư phạm, dán kết quả từ ChatGPT hoặc Gemini, chỉnh Markdown và xuất PDF/DOCX. Phù hợp khi cần kiểm soát chi tiết hoặc AI dùng chung quá tải.',
    keywords: [
      ...keywordGroups.exam,
      ...keywordGroups.export,
      ...keywordGroups.tech,
      'tạo đề thủ công',
      'prompt tạo đề thi',
      'chatgpt soạn đề',
      'gemini prompt đề kiểm tra',
    ],
    ogAlt: 'Tạo đề thủ công với prompt AI — CodeLab Study',
  },
  guide: {
    path: '/guide',
    title: 'Hướng dẫn sử dụng — Tạo đề AI, Markdown, xuất PDF/DOCX | CodeLab Study',
    description:
      'Hướng dẫn chi tiết CodeLab Study: hai cách tạo đề (AI & thủ công), giải thích form thông tin, cú pháp Markdown/KaTeX, xuất PDF/DOCX và câu hỏi thường gặp dành cho giáo viên THCS, THPT và học sinh.',
    keywords: [
      ...keywordGroups.brand,
      ...keywordGroups.tech,
      ...keywordGroups.export,
      'hướng dẫn tạo đề thi',
      'cách dùng ai soạn đề',
      'markdown đề kiểm tra',
      'faq tạo đề ai',
    ],
    ogAlt: 'Hướng dẫn CodeLab Study — Tạo đề thi bằng AI',
  },
};

/**
 * @param {keyof typeof pageSeo} pageId
 * @returns {import('next').Metadata}
 */
export function createPageMetadata(pageId) {
  const page = pageSeo[pageId];
  const keywords = [...new Set(page.keywords)];

  return {
    title: page.title,
    description: page.description,
    keywords: keywords.join(', '),
    alternates: {
      canonical: page.path,
    },
    openGraph: {
      type: 'website',
      locale: site.locale,
      siteName: site.name,
      url: page.path,
      title: page.title,
      description: page.description,
      images: [{ ...OG_IMAGE, alt: page.ogAlt || page.title }],
    },
    twitter: {
      card: 'summary_large_image',
      site: site.twitterHandle,
      title: page.title,
      description: page.description,
      images: [OG_IMAGE.url],
    },
  };
}

export function getBaseUrl() {
  return site.url.replace(/\/$/, '');
}

export function createOrganizationJsonLd() {
  const baseUrl = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.organization.name,
    url: `${site.organization.url}/`,
    email: site.organization.email,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/logo-codelab.png`,
    },
    sameAs: [`${site.organization.url}/`],
  };
}

export function createWebSiteJsonLd() {
  const baseUrl = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: `${baseUrl}/`,
    description: site.description,
    inLanguage: site.lang,
    publisher: {
      '@type': 'Organization',
      name: site.organization.name,
      url: `${site.organization.url}/`,
    },
  };
}

export function createWebApplicationJsonLd() {
  const baseUrl = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: site.name,
    url: `${baseUrl}/`,
    description: site.description,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    inLanguage: site.lang,
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'VND',
    },
    featureList: [
      'Tạo đề kiểm tra bằng AI Gemini đa môn, lớp 6–12',
      'Tạo đề thủ công với prompt ChatGPT/Gemini',
      'Xem trước Markdown với KaTeX',
      'Xuất file PDF và DOCX chuẩn in A4',
      'Dành cho giáo viên THCS, THPT và học sinh',
      'Miễn phí, không cần đăng ký',
    ],
    publisher: {
      '@type': 'Organization',
      name: site.organization.name,
      url: `${site.organization.url}/`,
    },
  };
}

/**
 * @param {Array<{ q: string, a: string }>} items
 */
export function createFaqJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: a.replace(/<[^>]+>/g, ''),
      },
    })),
  };
}

/**
 * @param {Array<{ name: string, url: string }>} items
 */
export function createBreadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** Nội dung SEO ẩn trên trang chủ — bổ sung ngữ cảnh cho crawler */
export const homeSeoContent = {
  headings: [
    'AI tạo đề thi miễn phí cho giáo viên và học sinh',
    'Soạn đề kiểm tra trắc nghiệm, tự luận lớp 6 đến lớp 12',
    'Xuất PDF và Word (DOCX) chuẩn in ấn A4',
  ],
  paragraphs: [
    'CodeLab Study là công cụ web miễn phí giúp giáo viên THCS, THPT và học sinh tạo đề kiểm tra bằng trí tuệ nhân tạo. Chọn môn Toán, Văn, Anh, Lý, Hóa, Sinh, Sử, Địa và nhiều môn khác; cấu hình số câu trắc nghiệm, tự luận, chủ đề, độ khó và loại bài kiểm tra.',
    'Hai cách làm việc: Tạo đề AI (Gemini soạn trực tiếp trên CodeLab) hoặc Tạo đề thủ công (sao chép prompt sang ChatGPT/Gemini). Công thức toán hiển thị bằng KaTeX; xuất file PDF để in hoặc DOCX để chỉnh trên Word.',
  ],
  keywordSummary: allKeywords().slice(0, 40).join(', '),
};
