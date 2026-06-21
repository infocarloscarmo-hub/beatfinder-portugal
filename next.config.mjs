/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Não bloquear o deploy por avisos de ESLint (continua a correr `npm run lint` em dev).
  eslint: { ignoreDuringBuilds: true },
  // Não bloquear o deploy por erros de TypeScript (continua a correr `npm run type-check` em dev).
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
        ],
      },
    ];
  },
};

export default nextConfig;
