import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Geist_Mono } from "next/font/google";
import GoogleAdSense from "@/components/analytics/GoogleAdSense";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://semicolonittech.com"),
  alternates: {
    canonical: "/",
  },
  title: {
    default: "Semicolon; | 기술의 미래를 읽다",
    template: "%s | Semicolon;",
  },
  description: "AI, 가젯, 소프트웨어의 최신 트렌드를 가장 쉽고 깊이 있게 전달합니다.",
  keywords: [
    "tech blog", "AI", "gadget", "software",
    "기술 블로그", "세미콜론", "세미콜론 블로그", "IT 블로그",
    "테크", "테크 뉴스", "IT 뉴스", "제품 리뷰",
    "얼리어답터", "최신 기술", "인공지능", "애플", "삼성"
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://semicolonittech.com",
    siteName: "Semicolon;",
    title: "Semicolon; | 기술의 미래를 읽다",
    description: "AI, 가젯, 소프트웨어의 최신 트렌드를 가장 쉽고 깊이 있게 전달합니다.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Semicolon; 기술 블로그",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Semicolon; | 기술의 미래를 읽다",
    description: "AI, 가젯, 소프트웨어의 최신 트렌드를 가장 쉽고 깊이 있게 전달합니다.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "MGBuUI6GGZ9sAn7F1Ij2HZVqJylU_wtKUKyNC77ezQ8",
    other: {
      "naver-site-verification": "aa9ce3123f34fc01269f0e47922cbff30c474481",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Canonical URL */}
        <link rel="canonical" href="https://semicolonittech.com" />

        {/* OpenGraph Meta Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="ko_KR" />
        <meta property="og:url" content="https://semicolonittech.com" />
        <meta property="og:site_name" content="Semicolon;" />
        <meta property="og:title" content="Semicolon; | 기술의 미래를 읽다" />
        <meta property="og:description" content="AI, 가젯, 소프트웨어의 최신 트렌드를 가장 쉽고 깊이 있게 전달합니다." />
        <meta property="og:image" content="https://semicolonittech.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Semicolon; | 기술의 미래를 읽다" />
        <meta name="twitter:description" content="AI, 가젯, 소프트웨어의 최신 트렌드를 가장 쉽고 깊이 있게 전달합니다." />
        <meta name="twitter:image" content="https://semicolonittech.com/og-image.png" />

        {/* Schema.org JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Semicolon;",
              "alternateName": "세미콜론",
              "url": "https://semicolonittech.com",
              "description": "AI, 가젯, 소프트웨어의 최신 트렌드를 가장 쉽고 깊이 있게 전달합니다.",
              "publisher": {
                "@type": "Organization",
                "name": "Semicolon;",
                "url": "https://semicolonittech.com"
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://semicolonittech.com/blog?search={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }),
          }}
        />

        <link rel="alternate" type="application/rss+xml" title="Semicolon; RSS Feed" href="/api/rss" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7603530695362433"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className={`${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <SessionProvider>
            <Header />
            <main className="pt-16 md:pt-20 min-h-screen">
              {children}
            </main>
            <Footer />
            <Analytics />
            <GoogleAnalytics gaId="G-W3HPY5Z44D" />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
