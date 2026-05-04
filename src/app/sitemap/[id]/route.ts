import { NextRequest, NextResponse } from "next/server";
import { getAllPostsForSitemap, getAllPostsByLangForSitemap, getCategories } from "@/lib/wp-api";

export const revalidate = 3600;

const BASE_URL = "https://semicolonittech.com";
const POSTS_PER_SITEMAP = 100;

// Route: GET /sitemap/[id].xml
// id=0 → static pages + categories
// id=1,2,3... → posts (100 per file)
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const index = parseInt(id, 10);

    let urls: string[] = [];

    if (index === 0) {
        // Static pages
        const staticPages = ["", "/blog", "/about", "/login", "/en", "/en/blog"];
        urls.push(...staticPages.map(p => `${BASE_URL}${p}`));

        // Categories
        const categories = await getCategories();
        urls.push(...categories.map(c => `${BASE_URL}/category/${c.slug}`));
    } else {
        // Posts — fetch all and paginate
        const [koPosts, enPosts] = await Promise.all([
            getAllPostsForSitemap(),
            getAllPostsByLangForSitemap("en"),
        ]);

        const allPostUrls = [
            ...koPosts.map(p => `${BASE_URL}/blog/${p.slug}`),
            ...enPosts.map(p => `${BASE_URL}/en/blog/${p.slug}`),
        ];

        const start = (index - 1) * POSTS_PER_SITEMAP;
        urls = allPostUrls.slice(start, start + POSTS_PER_SITEMAP);
    }

    if (urls.length === 0) {
        return new NextResponse("Not Found", { status: 404 });
    }

    // Build XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
    .map(
        url => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>${url === BASE_URL ? "1.0" : "0.8"}</priority>
  </url>`
    )
    .join("\n")}
</urlset>`;

    return new NextResponse(xml, {
        headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
    });
}
