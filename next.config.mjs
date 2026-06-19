/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['marked'],
  outputFileTracingRoot: import.meta.dirname,
  // Đóng gói binary Pandoc + template DOCX vào serverless function trên Vercel
  outputFileTracingIncludes: {
    '/api/export/docx': ['./bin/pandoc', './assets/reference.docx'],
    '/api/export/docx/route': ['./bin/pandoc', './assets/reference.docx'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
