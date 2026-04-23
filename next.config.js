/** @type {import('next').NextConfig} */
const repoName = 'ScanKart';
const basePath = process.env.NODE_ENV === 'production' ? `/${repoName}` : '';

const nextConfig = {
    output: 'export',
    trailingSlash: true,
    basePath,
    assetPrefix: basePath || undefined,
    images: {
        unoptimized: true,
    },
    // Optimize static file serving
    onDemandEntries: {
        maxInactiveAge: 60 * 1000,
        pagesBufferLength: 5,
    },
};

module.exports = nextConfig;