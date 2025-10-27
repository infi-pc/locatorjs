/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // This is a temporary workaround for Next.js 15 + React 18 type compatibility
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;

