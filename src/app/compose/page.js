import JsonLd from '@/components/JsonLd';
import {
  createBreadcrumbJsonLd,
  createPageMetadata,
  getBaseUrl,
  pageSeo,
} from '@/lib/seo';
import { site } from '@/lib/site';

export const metadata = createPageMetadata('compose');

export default function ComposePage() {
  const base = getBaseUrl();
  const breadcrumb = createBreadcrumbJsonLd([
    { name: site.name, url: `${base}/` },
    { name: 'Tạo đề thủ công', url: `${base}${pageSeo.compose.path}` },
  ]);

  return <JsonLd data={breadcrumb} />;
}
