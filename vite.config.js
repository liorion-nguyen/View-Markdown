import { defineConfig } from 'vite';
import { pandocExportPlugin } from './scripts/vite-pandoc-plugin.mjs';
import { site } from './site.config.js';

function injectSeoPlugin() {
  const replacements = {
    __SITE_URL__: site.url.replace(/\/$/, ''),
    __SITE_TITLE__: site.title,
    __SITE_DESCRIPTION__: site.description,
    __SITE_KEYWORDS__: site.keywords,
    __SITE_NAME__: site.name,
    __SITE_LOCALE__: site.locale,
    __SITE_LANG__: site.lang,
    __THEME_COLOR__: site.themeColor,
    __TWITTER_HANDLE__: site.twitterHandle,
    __ORG_NAME__: site.organization.name,
    __ORG_URL__: site.organization.url,
  };

  return {
    name: 'inject-seo',
    transformIndexHtml(html) {
      let result = html;
      for (const [key, value] of Object.entries(replacements)) {
        result = result.replaceAll(key, value);
      }
      return result;
    },
    generateBundle() {
      const base = site.url.replace(/\/$/, '');
      const today = new Date().toISOString().slice(0, 10);

      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${base}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`,
      });

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`,
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [injectSeoPlugin(), pandocExportPlugin()],
});
