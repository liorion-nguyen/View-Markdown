import 'katex/dist/katex.min.css';
import './globals.css';

import { Inter } from 'next/font/google';

import AppShell from '@/components/AppShell';
import JsonLd from '@/components/JsonLd';
import {
  allKeywords,
  createOrganizationJsonLd,
  createWebApplicationJsonLd,
  createWebSiteJsonLd,
  homeSeoContent,
} from '@/lib/seo';
import { site } from '@/lib/site';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
});

const baseUrl = site.url.replace(/\/$/, '');

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: site.title,
    template: `%s`,
  },
  description: site.description,
  keywords: allKeywords().join(', '),
  authors: [{ name: site.organization.name, url: `${site.organization.url}/` }],
  creator: site.organization.name,
  publisher: site.organization.name,
  category: 'education',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  applicationName: site.name,
  alternates: {
    canonical: '/',
    languages: {
      'vi-VN': '/',
    },
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
        width: 1200,
        height: 630,
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
    statusBarStyle: 'default',
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

export default function RootLayout({ children }) {
  return (
    <html lang={site.lang}>
      <head>
        <JsonLd data={createOrganizationJsonLd()} />
        <JsonLd data={createWebSiteJsonLd()} />
        <JsonLd data={createWebApplicationJsonLd()} />
      </head>
      <body className={inter.className}>
        <div className="seo-intro" id="seo-intro">
          <h1>{site.name} — AI tạo đề thi miễn phí cho giáo viên &amp; học sinh</h1>
          {homeSeoContent.headings.map((heading) => (
            <h2 key={heading}>{heading}</h2>
          ))}
          {homeSeoContent.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
          <p>
            Từ khóa: {homeSeoContent.keywordSummary}. Truy cập{' '}
            <a href={`${site.organization.url}/`}>{site.organization.name}</a> để tìm hiểu thêm các
            khoá học lập trình, STEM và chương trình giáo dục.
          </p>
          <nav aria-label="Trang chính">
            <a href="/">Trang chủ</a>
            {' · '}
            <a href="/workspace">Tạo đề AI</a>
            {' · '}
            <a href="/compose">Tạo đề thủ công</a>
            {' · '}
            <a href="/guide">Hướng dẫn</a>
          </nav>
        </div>
        <AppShell />
        {children}
      </body>
    </html>
  );
}
