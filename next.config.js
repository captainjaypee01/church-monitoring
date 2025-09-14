/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@neondatabase/serverless"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  // Fix for Windows path issues
  outputFileTracingRoot: __dirname,
  experimental: {
    // Disable webpack cache issues on Windows
    webpackBuildWorker: false,
  },
}

module.exports = nextConfig
