/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix for "Cannot read properties of undefined (reading 'os')" during patch-incorrect-lockfile
  // This is a workaround for some containerized environments
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })
    return config
  },
  // Ensure we don't have strict React mode issues in some specific deployments
  reactStrictMode: true,
  turbopack: {},
}

module.exports = nextConfig
