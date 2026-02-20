/**
 * WordPress REST API Client
 * Headless WordPress 백엔드에서 데이터를 가져오는 클라이언트
 */

// Force HTTP/1.1: Hostinger blocks Node.js HTTP/2 (PROTOCOL_ERROR)
import { Agent, fetch as undiciFetch } from "undici";

const http1Agent = new Agent({ allowH2: false });

const WP_API_URL = "https://wp.semicolonittech.com/wp-json/wp/v2";

// WordPress stored media URLs as https://semicolonittech.com/wp-content/...
// but that domain now points to Vercel. Rewrite to wp subdomain.
function fixMediaUrl(url: string): string {
    if (!url) return url;
    return url.replace(
        /https?:\/\/semicolonittech\.com\/wp-content\//g,
        "https://wp.semicolonittech.com/wp-content/"
    );
}


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

// Retry helper: retries on network errors (ECONNRESET, socket errors) with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit & { next?: NextFetchRequestConfig } = {}, retries = 3): Promise<Response> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // Use undici fetch with HTTP/1.1 agent — Hostinger blocks HTTP/2 (PROTOCOL_ERROR)
            const res = await undiciFetch(url, {
                ...options,
                // @ts-ignore — undici dispatcher option
                dispatcher: http1Agent,
            } as any);
            return res as unknown as Response;
        } catch (err: any) {
            const isNetworkError =
                err?.code === 'ECONNRESET' ||
                err?.code === 'UND_ERR_SOCKET' ||
                err?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
                err?.message?.includes('fetch failed') ||
                err?.message?.includes('PROTOCOL_ERROR');
            if (isNetworkError && attempt < retries) {
                const delay = attempt * 1000;
                console.warn(`[WP-API] Network error on attempt ${attempt}/${retries}, retrying in ${delay}ms...`, err?.code || err?.message);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
            throw err;
        }
    }
    throw new Error('fetchWithRetry: unreachable');
}

type NextFetchRequestConfig = { revalidate?: number; tags?: string[] };


export async function getPosts(perPage: number = 10, revalidate: number = 300, fields: string = ""): Promise<WPPost[]> {
    const fieldsParam = fields ? `&_fields=${fields}` : "";
    try {
        const res = await fetchWithRetry(
            `${WP_API_URL}/posts?per_page=${perPage}&categories_exclude=${PRODUCTS_CATEGORY_ID}&status=publish&_embed${fieldsParam}`,
            { next: { revalidate, tags: ["posts"] } }
        );
        if (!res.ok) {
            const errorText = await res.text().catch(() => "No error body");
            console.error(`[WP-API] Failed to fetch posts: ${res.status} ${res.statusText}`, errorText);
            return [];
        }
        const posts: WPPost[] = await res.json();
        return posts.filter(post => !post.categories.includes(PRODUCTS_CATEGORY_ID));
    } catch (err) {
        console.error('[WP-API] getPosts network error:', err);
        return [];
    }
}

export async function getPostsWithPagination(page: number = 1, perPage: number = 12): Promise<PaginatedPosts> {
    try {
        const res = await fetchWithRetry(
            `${WP_API_URL}/posts?page=${page}&per_page=${perPage}&categories_exclude=${PRODUCTS_CATEGORY_ID}&status=publish&_embed`,
            { next: { revalidate: 300, tags: ["posts"] } }
        );

        if (!res.ok) {
            if (res.status === 400) {
                return { posts: [], totalPages: 0, total: 0 };
            }
            console.error(`[WP-API] getPostsWithPagination failed: ${res.status}`);
            return { posts: [], totalPages: 0, total: 0 };
        }

        const totalPages = parseInt(res.headers.get("X-WP-TotalPages") || "1", 10);
        const total = parseInt(res.headers.get("X-WP-Total") || "0", 10);
        const posts = await res.json();
        return { posts, totalPages, total };
    } catch (err) {
        console.error('[WP-API] getPostsWithPagination network error:', err);
        return { posts: [], totalPages: 0, total: 0 };
    }
}

export async function getPostBySlug(slug: string): Promise<WPPost | null> {
    try {
        const res = await fetchWithRetry(
            `${WP_API_URL}/posts?slug=${slug}&_embed`,
            { next: { revalidate: 60, tags: ["posts", `post-${slug.slice(0, 50)}`] } }
        );
        if (!res.ok) return null;
        const posts = await res.json();
        return posts[0] || null;
    } catch (err) {
        console.error('[WP-API] getPostBySlug network error:', err);
        return null;
    }
}

export async function getCategories(): Promise<WPCategory[]> {
    try {
        const res = await fetchWithRetry(
            `${WP_API_URL}/categories?per_page=50`,
            { next: { revalidate: 300 } }
        );
        if (!res.ok) return [];
        return res.json();
    } catch (err) {
        console.error('[WP-API] getCategories network error:', err);
        return [];
    }
}

export async function getPostsByCategory(categoryId: number, perPage: number = 10): Promise<WPPost[]> {
    try {
        const res = await fetchWithRetry(
            `${WP_API_URL}/posts?categories=${categoryId}&per_page=${perPage}&_embed`,
            { next: { revalidate: 60 } }
        );
        if (!res.ok) return [];
        return res.json();
    } catch (err) {
        console.error('[WP-API] getPostsByCategory network error:', err);
        return [];
    }
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
    try {
        // 1. Try exact match
        const res = await fetchWithRetry(
            `${WP_API_URL}/categories?slug=${slug}`,
            { next: { revalidate: 300 } }
        );

        if (res.ok) {
            const categories = await res.json();
            if (categories.length > 0) return categories[0];
        }

        // 2. Fallback: fetch all and find partial match
        const allRes = await fetchWithRetry(
            `${WP_API_URL}/categories?per_page=100`,
            { next: { revalidate: 300 } }
        );

        if (allRes.ok) {
            const allCategories: WPCategory[] = await allRes.json();
            const match = allCategories.find(c =>
                c.slug === slug ||
                c.slug.endsWith(`-${slug}`) ||
                c.slug === `en-${slug}` ||
                c.slug === `ko-${slug}`
            );
            if (match) return match;
        }
    } catch (err) {
        console.error('[WP-API] getCategoryBySlug network error:', err);
    }

    return null;
}

// Helper: Featured Image URL 추출
export function getFeaturedImageUrl(post: WPPost): string | null {
    if (post._embedded?.["wp:featuredmedia"]?.[0]) {
        return fixMediaUrl(post._embedded["wp:featuredmedia"][0].source_url);
    }
    return null;
}

// Export for use in components that render post content HTML
export function sanitizePostContent(html: string): string {
    if (!html) return html;

    // 1. Fix WordPress media URLs
    let cleaned = html.replace(
        /https?:\/\/semicolonittech\.com\/wp-content\//g,
        "https://wp.semicolonittech.com/wp-content/"
    );

    // 2. Remove parasitic empty `<p>` tags often generated by copying from AI tools (e.g., Perplexity/ChatGPT)
    // Matches `<p><span style="...">[ZERO WIDTH SPACE or whitespace]</span></p>`
    // \u200B is Zero-Width Space, &zwj;, &nbsp; etc.
    cleaned = cleaned.replace(/<p>\s*<span[^>]*>[\s\u200B\u200C\u200D\uFEFF]*<\/span>\s*<\/p>/gi, '');

    // Matches `<p>[\s\u200B\u200C\u200D\uFEFF]*</p>`
    cleaned = cleaned.replace(/<p>[\s\u200B\u200C\u200D\uFEFF]*<\/p>/gi, '');

    // Matches `<p><br\s*\/?><\/p>`
    cleaned = cleaned.replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '');

    return cleaned;
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
