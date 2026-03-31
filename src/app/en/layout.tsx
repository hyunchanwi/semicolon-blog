import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import GoogleAdSense from "@/components/analytics/GoogleAdSense";
import "@/app/globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import Script from "next/script";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://semicolonittech.com"),
  alternates: {
    canonical: "/en",
    languages: {
      ko: "/",
      en: "/en",
    },
  },
  title: {
    default: "Semicolon; | Read the Future of Tech",
    template: "%s | Semicolon;",
  },
  description: "The latest trends in AI, gadgets, and software — explained simply and deeply.",
  keywords: [
    "tech blog", "AI", "gadget", "software",
    "technology news", "IT blog", "product review",
    "early adopter", "latest tech", "artificial intelligence", "Apple", "Samsung"
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://semicolonittech.com/en",
    siteName: "Semicolon;",
    title: "Semicolon; | Read the Future of Tech",
    description: "The latest trends in AI, gadgets, and software — explained simply and deeply.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Semicolon; Tech Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Semicolon; | Read the Future of Tech",
    description: "The latest trends in AI, gadgets, and software — explained simply and deeply.",
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
};

export default function EnglishLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // English pages use the root layout's <html> and <body>.
  // This layout just wraps children so English-specific metadata applies.
  return <>{children}</>;
}
