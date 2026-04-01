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
        translation_group?: string;
        translation_pair?: number;
        lang?: string;
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

// English tag ID to exclude English posts from Korean blog feed
const EN_TAG_ID = 33;

// Sanitize WP_AUTH to avoid issues with trailing characters/newlines on Vercel
const WP_AUTH = (process.env.WP_AUTH || "").trim();

// Retry helper: retries on network errors (ECONNRESET, socket errors) with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // ALWAYS use undici fetch with HTTP/1.1 agent — Hostinger blocks HTTP/2 (PROTOCOL_ERROR)
            // This prevents Vercel build failures
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

import { unstable_cache } from 'next/cache';

export async function getPosts(perPage: number = 10, revalidate: number = 300, fields: string = ""): Promise<WPPost[]> {
    const fieldsParam = fields ? `&_fields=${fields}` : "";
    const fetchPosts = async () => {
        try {
            const res = await fetchWithRetry(
                `${WP_API_URL}/posts?per_page=${perPage}&categories_exclude=${PRODUCTS_CATEGORY_ID}&tags_exclude=${EN_TAG_ID}&status=publish&_embed${fieldsParam}`
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
    };

    const cachedFn = unstable_cache(fetchPosts, [`posts-getPosts-${perPage}-${fields}`], { revalidate, tags: ["posts"] });
    return await cachedFn();
}

export async function getPostsWithPagination(page: number = 1, perPage: number = 12, revalidate: number = 300): Promise<PaginatedPosts> {
    const fetchPaginated = async () => {
        try {
            const res = await fetchWithRetry(
                `${WP_API_URL}/posts?page=${page}&per_page=${perPage}&categories_exclude=${PRODUCTS_CATEGORY_ID}&tags_exclude=${EN_TAG_ID}&status=publish&_embed`
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
            const posts: WPPost[] = await res.json();
            return {
                posts: posts.filter(post => !post.categories.includes(PRODUCTS_CATEGORY_ID)),
                totalPages,
                total
            };
        } catch (err) {
            console.error('[WP-API] getPostsWithPagination network error:', err);
            return { posts: [], totalPages: 0, total: 0 };
        }
    };

    const cachedPaginatedFn = unstable_cache(fetchPaginated, [`posts-pagination-${page}-${perPage}`], { revalidate, tags: ["posts"] });
    return await cachedPaginatedFn();
}

/**
 * SEO 사이트맵 전용: 모든 한국어 게시글을 페이지 단위로 끝까지 불러와서 배열 하나로 합쳐서 반환합니다.
 */
export async function getAllPostsForSitemap(): Promise<WPPost[]> {
    let allPosts: WPPost[] = [];
    let page = 1;
    let totalPages = 1;

    do {
        try {
            const res = await fetchWithRetry(
                `${WP_API_URL}/posts?page=${page}&per_page=100&categories_exclude=${PRODUCTS_CATEGORY_ID}&tags_exclude=${EN_TAG_ID}&status=publish&_fields=id,slug,date,categories,meta`
            );
            if (!res.ok) break;

            if (page === 1) {
                totalPages = parseInt(res.headers.get("X-WP-TotalPages") || "1", 10);
            }

            const posts = await res.json();
            allPosts = allPosts.concat(posts.filter((post: any) => !post.categories.includes(PRODUCTS_CATEGORY_ID)));
            page++;
        } catch (err) {
            console.error('[WP-API] getAllPostsForSitemap error:', err);
            break;
        }
    } while (page <= totalPages);

    return allPosts;
}

/**
 * SEO 사이트맵 전용: 모든 해당 언어 태그 게시글을 끝까지 불러와서 반환합니다.
 */
export async function getAllPostsByLangForSitemap(lang: string): Promise<WPPost[]> {
    let allPosts: WPPost[] = [];
    let page = 1;
    let totalPages = 1;

    // 언어 태그 ID 찾기
    const tagsRes = await fetchWithRetry(`${WP_API_URL}/tags?slug=${lang}`);
    if (!tagsRes.ok) return [];
    const tags = await tagsRes.json();
    if (tags.length === 0) return [];
    const langTagId = tags[0].id;

    do {
        try {
            const res = await fetchWithRetry(
                `${WP_API_URL}/posts?page=${page}&per_page=100&categories_exclude=${PRODUCTS_CATEGORY_ID}&tags=${langTagId}&status=publish&_fields=id,slug,date,categories,meta`
            );
            if (!res.ok) break;

            if (page === 1) {
                totalPages = parseInt(res.headers.get("X-WP-TotalPages") || "1", 10);
            }

            const posts = await res.json();
            allPosts = allPosts.concat(posts.filter((post: any) => !post.categories.includes(PRODUCTS_CATEGORY_ID)));
            page++;
        } catch (err) {
            console.error('[WP-API] getAllPostsByLangForSitemap error:', err);
            break;
        }
    } while (page <= totalPages);

    return allPosts;
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
            `${WP_API_URL}/posts?categories=${categoryId}&tags_exclude=${EN_TAG_ID}&per_page=${perPage}&_embed`,
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

// ──────────────────────────────────────────────
// 다국어(i18n) 지원 함수
// ──────────────────────────────────────────────

/**
 * 언어별 태그로 필터링된 포스트를 페이지네이션으로 가져옵니다.
 * 영어 글은 'en' 태그가 달려있고, 한국어 글에는 'en' 태그가 없습니다.
 */
export async function getPostsWithPaginationByLang(
    lang: 'ko' | 'en',
    page: number = 1,
    perPage: number = 12,
    revalidate: number = 300
): Promise<PaginatedPosts> {
    const fetchPaginated = async () => {
        try {
            // For English: fetch posts that have the 'en' tag
            // For Korean: use existing logic (exclude products, no 'en' tag filter)
            let url = `${WP_API_URL}/posts?page=${page}&per_page=${perPage}&categories_exclude=${PRODUCTS_CATEGORY_ID}&status=publish&_embed`;

            if (lang === 'en') {
                // We need to find the 'en' tag ID first
                const tagRes = await fetchWithRetry(`${WP_API_URL}/tags?slug=en`);
                if (tagRes.ok) {
                    const tags = await tagRes.json();
                    if (tags.length > 0) {
                        url += `&tags=${tags[0].id}`;
                    } else {
                        // 'en' tag doesn't exist yet, no English posts
                        return { posts: [], totalPages: 0, total: 0 };
                    }
                }
            }

            const res = await fetchWithRetry(url);

            if (!res.ok) {
                if (res.status === 400) {
                    return { posts: [], totalPages: 0, total: 0 };
                }
                console.error(`[WP-API] getPostsWithPaginationByLang(${lang}) failed: ${res.status}`);
                return { posts: [], totalPages: 0, total: 0 };
            }

            const totalPages = parseInt(res.headers.get("X-WP-TotalPages") || "1", 10);
            const total = parseInt(res.headers.get("X-WP-Total") || "0", 10);
            const posts: WPPost[] = await res.json();
            return {
                posts: posts.filter(post => !post.categories.includes(PRODUCTS_CATEGORY_ID)),
                totalPages,
                total
            };
        } catch (err) {
            console.error(`[WP-API] getPostsWithPaginationByLang(${lang}) error:`, err);
            return { posts: [], totalPages: 0, total: 0 };
        }
    };

    const cachedFn = unstable_cache(
        fetchPaginated,
        [`posts-lang-${lang}-${page}-${perPage}`],
        { revalidate, tags: ["posts"] }
    );
    return await cachedFn();
}

/**
 * 포스트 ID로 번역 짝꿍 글 정보를 가져옵니다.
 * translation_pair 메타에 저장된 상대방 글 ID를 조회합니다.
 */
export async function getTranslationPair(postId: number): Promise<{ id: number; slug: string; lang: string } | null> {
    try {
        const res = await fetchWithRetry(
            `${WP_API_URL}/posts/${postId}?_fields=id,slug,meta`,
            { next: { revalidate: 300 } }
        );
        if (!res.ok) return null;
        const post = await res.json();
        return {
            id: post.id,
            slug: post.slug,
            lang: post.meta?.lang || 'ko',
        };
    } catch (err) {
        console.error('[WP-API] getTranslationPair error:', err);
        return null;
    }
}
