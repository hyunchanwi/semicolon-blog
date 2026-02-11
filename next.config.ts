import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 성능 최적화
  compress: true, // gzip 압축 활성화
  poweredByHeader: false, // X-Powered-By 헤더 제거 (보안 + 성능)

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'royalblue-anteater-980825.hostingersite.com',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: '*.tavily.com',
      },
    ],
    // 이미지 최적화 강화
    formats: ['image/avif', 'image/webp'],
  },

  // 정적 자산 캐시 헤더
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

