/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',

  // Allow cross-origin development
  allowedDevOrigins: ['*'],
};

module.exports = nextConfig;
