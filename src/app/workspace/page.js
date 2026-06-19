import JsonLd from '@/components/JsonLd';
import {
  createBreadcrumbJsonLd,
  createPageMetadata,
  getBaseUrl,
  pageSeo,
} from '@/lib/seo';
import { site } from '@/lib/site';

export const metadata = createPageMetadata('workspace');

export default function WorkspacePage() {
  const base = getBaseUrl();
  const breadcrumb = createBreadcrumbJsonLd([
    { name: site.name, url: `${base}/` },
    { name: 'Tạo đề AI', url: `${base}${pageSeo.workspace.path}` },
  ]);

  return <JsonLd data={breadcrumb} />;
}
