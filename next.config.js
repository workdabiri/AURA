const createNextIntlPlugin = require('next-intl/plugin')

// AURA-201: point the next-intl plugin at the request config under src/.
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // lint is the dedicated lint authority; next build's redundant ESLint pass is disabled
    ignoreDuringBuilds: true,
  },
}

module.exports = withNextIntl(nextConfig)
