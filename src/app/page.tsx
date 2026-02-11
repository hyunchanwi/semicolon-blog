import { HeroSection } from "@/components/home/HeroSection";
import { TopicCarousel } from "@/components/home/TopicCarousel";
import { LatestPosts } from "@/components/home/LatestPosts";
import { SchemaOrg } from "@/components/seo/SchemaOrg";
import { GoogleAdUnit } from "@/components/ads/GoogleAdUnit";

import { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <>
      <SchemaOrg type="WebSite" />
      <HeroSection />
      <TopicCarousel />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GoogleAdUnit
          slotId="2792054250"
          format="fluid"
          layout="in-article"
        />
      </div>
      <LatestPosts />
    </>
  );
}
