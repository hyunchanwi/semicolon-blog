import { HeroSection } from "@/components/home/HeroSection";
import { TopicCarousel } from "@/components/home/TopicCarousel";
import { LatestPosts } from "@/components/home/LatestPosts";
import { SchemaOrg } from "@/components/seo/SchemaOrg";

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
      <LatestPosts />
    </>
  );
}
