/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['marked'],
  outputFileTracingRoot: import.meta.dirname,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
