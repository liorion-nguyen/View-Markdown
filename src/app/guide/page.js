import JsonLd from '@/components/JsonLd';
import { FAQ_ITEMS } from '@/lib/guide';
import {
  createBreadcrumbJsonLd,
  createFaqJsonLd,
  createPageMetadata,
  getBaseUrl,
  pageSeo,
} from '@/lib/seo';
import { site } from '@/lib/site';

export const metadata = createPageMetadata('guide');

export default function GuidePage() {
  const base = getBaseUrl();

  return (
    <>
      <JsonLd
        data={createBreadcrumbJsonLd([
          { name: site.name, url: `${base}/` },
          { name: 'Hướng dẫn', url: `${base}${pageSeo.guide.path}` },
        ])}
      />
      <JsonLd data={createFaqJsonLd(FAQ_ITEMS)} />
    </>
  );
}
