import { site } from '@/lib/site';

export default function robots() {
  const base = site.url.replace(/\/$/, '');

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
