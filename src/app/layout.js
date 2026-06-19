import 'katex/dist/katex.min.css';
import './globals.css';

import { Inter } from 'next/font/google';

import AppShell from '@/components/AppShell';
import { site } from '@/lib/site';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
});

const baseUrl = site.url.replace(/\/$/, '');

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: site.title,
  description: site.description,
  keywords: site.keywords,
  authors: [{ name: site.organization.name }],
  robots: 'index, follow, max-image-preview:large',
  applicationName: site.name,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: site.name,
    locale: site.locale,
    url: '/',
    title: site.title,
    description: site.description,
    images: [
      {
        url: '/logo-codelab.png',
        alt: `${site.name} — AI tạo đề thi cho giáo viên & học sinh`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: site.twitterHandle,
    title: site.title,
    description: site.description,
    images: ['/logo-codelab.png'],
  },
  icons: {
    icon: '/logo_icon.png',
    apple: '/logo_icon.png',
  },
  appleWebApp: {
    capable: true,
    title: site.name,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'format-detection': 'telephone=no',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: site.themeColor,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: site.name,
  url: `${baseUrl}/`,
  description: site.description,
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Any',
  browserRequirements: 'Requires JavaScript. Requires HTML5.',
  inLanguage: 'vi',
  isAccessibleForFree: true,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'VND',
  },
  publisher: {
    '@type': 'Organization',
    name: site.organization.name,
    url: `${site.organization.url}/`,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/logo-codelab.png`,
    },
  },
  featureList: [
    'Tạo đề kiểm tra bằng AI đa môn, lớp 6–12',
    'Xem trước Markdown với KaTeX',
    'Xuất file PDF và DOCX',
    'Dành cho giáo viên và học sinh',
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang={site.lang}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>
        <div className="seo-intro" id="seo-intro">
          <h1>{site.name} — AI tạo đề thi cho giáo viên & học sinh</h1>
          <p>
            {site.description} Truy cập{' '}
            <a href={`${site.organization.url}/`}>{site.organization.name}</a> để tìm hiểu thêm
            các khoá học và chương trình giáo dục.
          </p>
        </div>
        <AppShell />
        {children}
      </body>
    </html>
  );
}
