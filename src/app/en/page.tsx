import { HeroSection } from "@/components/home/HeroSection";
import { LatestPosts } from "@/components/home/LatestPosts";
import { GoogleAdUnit } from "@/components/ads/GoogleAdUnit";
import { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/en",
    languages: {
      ko: "/",
      en: "/en",
    },
  },
};

export default function EnglishHomePage() {
  return (
    <>
      {/* Hero Section */}
      <HeroSection isEnglish={true} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GoogleAdUnit
          slotId="2792054250"
          format="fluid"
          layout="in-article"
        />
      </div>
      {/* LatestPosts fetching English posts */}
      <LatestPosts isEnglish={true} />
    </>
  );
}
