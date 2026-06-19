import { site } from '@/lib/site';

export default function sitemap() {
  const base = site.url.replace(/\/$/, '');
  const today = new Date().toISOString().slice(0, 10);

  return [
    {
      url: `${base}/`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${base}/guide`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${base}/compose`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${base}/workspace`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];
}
