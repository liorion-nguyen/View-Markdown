import { pageSeo } from '@/lib/seo';
import { site } from '@/lib/site';

export default function sitemap() {
  const base = site.url.replace(/\/$/, '');
  const today = new Date().toISOString();

  return Object.values(pageSeo).map((page) => ({
    url: `${base}${page.path}`,
    lastModified: today,
    changeFrequency: page.path === '/' ? 'weekly' : page.path === '/guide' ? 'monthly' : 'weekly',
    priority: page.path === '/' ? 1 : page.path === '/guide' ? 0.8 : 0.9,
  }));
}
