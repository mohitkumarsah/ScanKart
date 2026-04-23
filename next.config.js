/** @type {import('next').NextConfig} */
const nextConfig = {
    trailingSlash: true,
    basePath: '/ScanKart',
    assetPrefix: '/ScanKart',
    images: {
        unoptimized: true,
    },
    // Disable type checking during build (handled separately)
    typescript: {
        ignoreBuildErrors: true,
    },
    // Disable ESLint during build
    eslint: {
        ignoreDuringBuilds: true,
    },
};

module.exports = nextConfig;