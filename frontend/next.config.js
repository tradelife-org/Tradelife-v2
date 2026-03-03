/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'c6ae184b-4e10-4851-aa38-34ab1d88652f.preview.emergentagent.com',
        'c6ae184b-4e10-4851-aa38-34ab1d88652f.cluster-0.preview.emergentcf.cloud',
        'pricing-layer-v2.cluster-0.preview.emergentcf.cloud',
        '*.preview.emergentagent.com',
        '*.preview.emergentcf.cloud',
        'localhost:3000',
      ],
    },
  },
}
module.exports = nextConfig
