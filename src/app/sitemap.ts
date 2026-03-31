import { getPosts, getCategories } from "@/lib/wp-api";
import { getPostsWithPaginationByLang } from "@/lib/wp-api";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = "https://semicolonittech.com";

    // 1. Static Routes (Korean)
    const routes = [
        "",
        "/blog",
        "/about",
        "/login",
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: route === "" ? 1 : 0.8,
    }));

    // 1.5 Static Routes (English)
    const enRoutes = [
        "/en",
        "/en/blog",
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.7,
    }));

    // 2. Korean Blog Posts
    const posts = await getPosts(100, 300, "id,slug,date,categories,meta");
    const postRoutes = posts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    // 3. English Blog Posts
    const { posts: enPosts } = await getPostsWithPaginationByLang("en", 1, 100);
    const enPostRoutes = enPosts.map((post) => ({
        url: `${baseUrl}/en/blog/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: "weekly" as const,
        priority: 0.7,
    }));

    // 4. Categories
    const categories = await getCategories();
    const categoryRoutes = categories.map((cat) => ({
        url: `${baseUrl}/category/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.5,
    }));

    return [...routes, ...enRoutes, ...postRoutes, ...enPostRoutes, ...categoryRoutes];
}

