/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      // PDFKit requires canvas which needs to be external
      config.externals.push('canvas');
    }
    return config;
  },
  serverExternalPackages: ['canvas', 'pdfkit'],
  env: {
    NEXT_PUBLIC_APP_NAME: 'QuantumCV',
  },
};

module.exports = nextConfig;
