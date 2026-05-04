import { NextResponse } from "next/server";
import { getAllPostsForSitemap, getAllPostsByLangForSitemap } from "@/lib/wp-api";

export const revalidate = 3600;

const BASE_URL = "https://semicolonittech.com";
const POSTS_PER_SITEMAP = 100;

// GET /sitemap.xml — returns a sitemap index listing all sub-sitemaps
export async function GET() {
    const [koPosts, enPosts] = await Promise.all([
        getAllPostsForSitemap(),
        getAllPostsByLangForSitemap("en"),
    ]);

    const totalPosts = koPosts.length + enPosts.length;
    const numPostSitemaps = Math.ceil(totalPosts / POSTS_PER_SITEMAP);

    // id=0 is static pages; id=1..N are post batches
    const sitemapIds = [0, ...Array.from({ length: numPostSitemaps }, (_, i) => i + 1)];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapIds
    .map(
        id => `  <sitemap>
    <loc>${BASE_URL}/sitemap/${id}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`
    )
    .join("\n")}
</sitemapindex>`;

    return new NextResponse(xml, {
        headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
    });
}
