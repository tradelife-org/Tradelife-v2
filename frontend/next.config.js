/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'tradelife.app',
        'www.tradelife.app',
        'c6ae184b-4e10-4851-aa38-34ab1d88652f.preview.emergentagent.com',
        'c6ae184b-4e10-4851-aa38-34ab1d88652f.cluster-0.preview.emergentcf.cloud',
        'pricing-layer-v2.cluster-0.preview.emergentcf.cloud',
        'pricing-layer-v2.cluster-1.preview.emergentcf.cloud',
        'pricing-layer-v2.cluster-2.preview.emergentcf.cloud',
        'pricing-layer-v2.cluster-3.preview.emergentcf.cloud',
        'pricing-layer-v2.cluster-4.preview.emergentcf.cloud',
        'pricing-layer-v2.cluster-5.preview.emergentcf.cloud',
        'pricing-layer-v2.cluster-6.preview.emergentcf.cloud',
        'pricing-layer-v2.cluster-7.preview.emergentcf.cloud',
        'pricing-layer-v2.cluster-8.preview.emergentcf.cloud',
        'pricing-layer-v2.cluster-9.preview.emergentcf.cloud',
        'pricing-layer-v2.cluster-10.preview.emergentcf.cloud',
        'pricing-layer-v2.cluster-11.preview.emergentcf.cloud',
        'pricing-layer-v2.cluster-12.preview.emergentcf.cloud',
        'localhost:3000',
      ],
    },
  },
}
module.exports = nextConfig
