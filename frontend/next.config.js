/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'tradelife.app',
        'www.tradelife.app',
        'localhost:3000',
      ],
    },
  },
}
module.exports = nextConfig
