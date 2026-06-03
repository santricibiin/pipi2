/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['camoufox-js', 'playwright'],
  },
}

module.exports = nextConfig
