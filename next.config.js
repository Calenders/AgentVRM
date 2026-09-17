/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  assetPrefix: process.env.BASE_PATH || "",
  basePath: process.env.BASE_PATH || "",
  publicRuntimeConfig: {
    root: process.env.BASE_PATH || "",
  },
  optimizeFonts: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://generativelanguage.googleapis.com https://api.su-shiki.com https://api.tts.quest;"
          }
        ]
      }
    ]
  },
};

module.exports = nextConfig;
