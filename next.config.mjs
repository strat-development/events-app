/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'media.graphassets.com',
                port: '',
                pathname: '**',
            },
        ],
    },
} 

export default nextConfig;
