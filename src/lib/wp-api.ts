/**
 * WordPress REST API Client
 * Headless WordPress 백엔드에서 데이터를 가져오는 클라이언트
 */

const WP_API_URL = "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";

// Types
export interface WPPost {
    id: number;
    slug: string;
    title: { rendered: string };
    excerpt: { rendered: string };
    content: { rendered: string };
    date: string;
    status: string; // 'publish', 'draft', 'private', 'pending'
    featured_media: number;
    categories: number[];
    tags: number[]; // Added tags
    meta?: {
        ai_summary?: string;
    };
    _embedded?: {
        "wp:featuredmedia"?: Array<{
            source_url: string;
            alt_text: string;
        }>;
        "wp:term"?: Array<Array<{
            id: number;
            name: string;
            slug: string;
        }>>;
    };
}

export interface WPCategory {
    id: number;
    name: string;
    slug: string;
    count: number;
    description: string;
    parent: number;
}

export interface WPPage {
    id: number;
    slug: string;
    title: { rendered: string };
    content: { rendered: string };
}

// API Functions
// Pagination Response Type
export interface PaginatedPosts {
    posts: WPPost[];
    totalPages: number;
    total: number;
}

// PICKS (Products) Category ID to exclude from main blog feed
const PRODUCTS_CATEGORY_ID = 32;

// Sanitize WP_AUTH to avoid issues with trailing characters/newlines on Vercel
const WP_AUTH = (process.env.WP_AUTH || "").trim();

export async function getPosts(perPage: number = 10, revalidate: number = 300, fields: string = ""): Promise<WPPost[]> {
    const fieldsParam = fields ? `&_fields=${fields}` : "";
    const res = await fetch(
        `${WP_API_URL}/posts?per_page=${perPage}&categories_exclude=${PRODUCTS_CATEGORY_ID}&_embed${fieldsParam}`,
        { next: { revalidate, tags: ["posts"] } }
    );
    if (!res.ok) {
        const errorText = await res.text().catch(() => "No error body");
        console.error(`[WP-API] Failed to fetch posts: ${res.status} ${res.statusText}`, errorText);
        throw new Error(`Failed to fetch posts: ${res.status}`);
    }
    const posts: WPPost[] = await res.json();
    // Double check: Filter out any posts that might have slipped through (e.g. cache issues)
    return posts.filter(post => !post.categories.includes(PRODUCTS_CATEGORY_ID));
}

export async function getPostsWithPagination(page: number = 1, perPage: number = 12): Promise<PaginatedPosts> {
    const res = await fetch(
        `${WP_API_URL}/posts?page=${page}&per_page=${perPage}&categories_exclude=${PRODUCTS_CATEGORY_ID}&_embed`,
        { next: { revalidate: 300, tags: ["posts"] } }
    );


    if (!res.ok) {
        // Handle 400 Bad Request (e.g. page out of range)
        if (res.status === 400) {
            return { posts: [], totalPages: 0, total: 0 };
        }
        throw new Error("Failed to fetch posts");
    }

    const totalPages = parseInt(res.headers.get("X-WP-TotalPages") || "1", 10);
    const total = parseInt(res.headers.get("X-WP-Total") || "0", 10);
    const posts = await res.json();

    return { posts, totalPages, total };
}

export async function getPostBySlug(slug: string): Promise<WPPost | null> {
    const res = await fetch(
        `${WP_API_URL}/posts?slug=${slug}&_embed`,
        { next: { revalidate: 60, tags: ["posts", `post-${slug.slice(0, 50)}`] } } // 1분 ISR 캐시 + 태그 길이 제한
    );
    if (!res.ok) throw new Error("Failed to fetch post");
    const posts = await res.json();
    return posts[0] || null;
}

export async function getCategories(): Promise<WPCategory[]> {
    const res = await fetch(
        `${WP_API_URL}/categories?per_page=50`,
        { next: { revalidate: 300 } } // 5분 캐시
    );
    if (!res.ok) throw new Error("Failed to fetch categories");
    return res.json();
}

export async function getPostsByCategory(categoryId: number, perPage: number = 10): Promise<WPPost[]> {
    const res = await fetch(
        `${WP_API_URL}/posts?categories=${categoryId}&per_page=${perPage}&_embed`,
        { next: { revalidate: 60 } } // 1분 ISR 캐시 (성능 최적화)
    );
    if (!res.ok) throw new Error("Failed to fetch posts by category");
    return res.json();
}

export async function getTags(): Promise<{ id: number; name: string }[]> {
    const res = await fetch(
        `${WP_API_URL}/tags?per_page=100`,
        { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    return res.json();
}

export async function getCategoryBySlug(slug: string): Promise<WPCategory | null> {
    // Manual Alias for 'Other' Removed, as the actual slug is 'other'

    // 1. Try exact match
    const res = await fetch(
        `${WP_API_URL}/categories?slug=${slug}`,
        { next: { revalidate: 300 } }
    );

    if (res.ok) {
        const categories = await res.json();
        if (categories.length > 0) return categories[0];
    }

    // 2. If no exact match, try fetching all categories and finding one that "ends with" the slug
    // This handles cases like 'en-technology' matching 'technology'
    // or if the user provided slug is simple but WP has complex slugs.
    const allRes = await fetch(
        `${WP_API_URL}/categories?per_page=100`,
        { next: { revalidate: 300 } }
    );

    if (allRes.ok) {
        const allCategories: WPCategory[] = await allRes.json();
        // Try to find a partial match (suffix) or case-insensitive match
        const match = allCategories.find(c =>
            c.slug === slug ||
            c.slug.endsWith(`-${slug}`) ||
            c.slug === `en-${slug}` ||
            c.slug === `ko-${slug}`
        );
        if (match) return match;
    }

    return null;
}

// Helper: Featured Image URL 추출
export function getFeaturedImageUrl(post: WPPost): string | null {
    if (post._embedded?.["wp:featuredmedia"]?.[0]) {
        return post._embedded["wp:featuredmedia"][0].source_url;
    }
    return null;
}

// Helper: HTML 태그 제거
export function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").trim();
}

// Helper: HTML 엔티티 디코딩
export function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&#8216;/g, "'")
        .replace(/&#8217;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&#8211;/g, "–")
        .replace(/&#8212;/g, "—")
        .replace(/&#038;/g, "&")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#8230;/g, "...")
        .replace(/&#8216;/g, "'")
        .replace(/&#8217;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&#8211;/g, "–")
        .replace(/&#8212;/g, "—")
        .replace(/&nbsp;/g, " ");
}

// 미디어 정보 가져오기
export async function getMedia(id: number): Promise<{ source_url: string } | null> {
    const res = await fetch(`${WP_API_URL}/media/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
}
