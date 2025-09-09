/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  experimental: {
    turbo: {
      root: __dirname,
    },
  },
}

module.exports = nextConfig
