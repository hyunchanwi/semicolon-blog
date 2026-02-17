import { getPosts, getCategories } from "@/lib/wp-api";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = "https://semicolonittech.com";

    // 1. Static Routes
    const routes = [
        "",
        "/blog",
        "/about",
        "/login",
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: route === "" ? 1 : 0.8, // Homepage 1.0, others 0.8
    }));

    // 2. Blog Posts
    const posts = await getPosts(100); // 1000 is invalid for WP (usually max 100)
    const postRoutes = posts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    // 3. Categories
    const categories = await getCategories();
    const categoryRoutes = categories.map((cat) => ({
        url: `${baseUrl}/category/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.5,
    }));

    return [...routes, ...postRoutes, ...categoryRoutes];
}
