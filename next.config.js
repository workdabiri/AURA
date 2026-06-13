/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // lint is the dedicated lint authority; next build's redundant ESLint pass is disabled
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
