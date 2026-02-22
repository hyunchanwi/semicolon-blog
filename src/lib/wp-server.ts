import { WPPost } from "./wp-api";
import { googlePublishUrl } from "./google-indexing";
import { revalidatePath, revalidateTag } from "next/cache";
// Force HTTP/1.1: Hostinger blocks HTTP/2 (PROTOCOL_ERROR) - same fix as wp-api.ts
import { Agent, fetch as undiciFetch } from "undici";

const http1Agent = new Agent({ allowH2: false });

// Wrapper that forces HTTP/1.1 for all Hostinger API calls
async function wpFetch(url: string, options: any = {}): Promise<any> {
    return undiciFetch(url, { ...options, dispatcher: http1Agent }) as any;
}

const WP_API_URL = process.env.WP_API_URL || "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();


/**
 * Uploads an image from a URL to WordPress Media Library
 */
export async function uploadImageFromUrl(imageUrl: string, title: string, wpAuth: string): Promise<{ id: number; source_url: string } | null> {
    try {
        console.log(`[WP-Upload] Attempting to download image: ${imageUrl}`);

        // 1. Download image
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) throw new Error(`Failed to download image from ${imageUrl}: ${imgRes.status}`);

        const arrayBuffer = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
        const extension = contentType.split('/')[1] || 'jpg';
        const filename = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.${extension}`;

        // 2. Upload to WordPress (Direct Binary)
        console.log(`[WP-Upload] Uploading to WordPress as ${filename}...`);
        const uploadRes = await wpFetch(`${WP_API_URL}/media`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${wpAuth}`,
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
            body: buffer
        });

        if (!uploadRes.ok) {
            const errorText = await uploadRes.text();
            console.error(`[WP-Upload] Failed: ${uploadRes.status}`, errorText);
            return null;
        }

        const data = await uploadRes.json();
        console.log(`[WP-Upload] ✅ Success: ID ${data.id}`);

        // 3. Update Title (Optional but recommended)
        try {
            await wpFetch(`${WP_API_URL}/media/${data.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${wpAuth}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: title,
                    alt_text: title,
                    caption: title
                })
            });
        } catch (updateErr) {
            console.warn(`[WP-Upload] Failed to update image metadata (non-critical):`, updateErr);
        }

        return {
            id: data.id,
            source_url: data.source_url
        };
    } catch (e) {
        console.error("[WP-Upload] Error:", e);
        return null;
    }
}

/**
 * Gets or creates a category by name
 */
export async function getOrCreateCategory(name: string, wpAuth: string): Promise<number | null> {
    try {
        // 1. Check if category exists
        const res = await wpFetch(`${WP_API_URL}/categories?search=${encodeURIComponent(name)}`, {
            headers: { 'Authorization': `Basic ${wpAuth}` }
        });

        if (res.ok) {
            const categories = await res.json();
            const existing = categories.find((c: any) => c.name.toLowerCase() === name.toLowerCase());
            if (existing) return existing.id;
        }

        // 2. Create category
        const createRes = await wpFetch(`${WP_API_URL}/categories`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${wpAuth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });

        if (createRes.ok) {
            const newCat = await createRes.json();
            return newCat.id;
        }

        return null;
    } catch (e) {
        console.error("[WP-Category] Error:", e);
        return null;
    }
}

/**
 * Gets or creates a tag by name
 */
export async function getOrCreateTag(name: string, wpAuth: string): Promise<number | null> {
    try {
        // 1. Check if tag exists
        const res = await wpFetch(`${WP_API_URL}/tags?search=${encodeURIComponent(name)}`, {
            headers: { 'Authorization': `Basic ${wpAuth}` }
        });

        if (res.ok) {
            const tags = await res.json();
            const existing = tags.find((t: any) => t.name.toLowerCase() === name.toLowerCase());
            if (existing) return existing.id;
        }

        // 2. Create tag
        const createRes = await wpFetch(`${WP_API_URL}/tags`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${wpAuth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });

        if (createRes.ok) {
            const newTag = await createRes.json();
            return newTag.id;
        }

        return null;
    } catch (e) {
        console.error("[WP-Tag] Error:", e);
        return null;
    }
}

/**
 * Gets recent posts generated by automation to prevent duplicates
 */
export async function getRecentAutomationPosts(wpAuth: string): Promise<WPPost[]> {
    try {
        const res = await wpFetch(`${WP_API_URL}/posts?per_page=100&status=publish,draft,private`, {
            headers: { 'Authorization': `Basic ${wpAuth}` },
            cache: 'no-store'
        });

        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("[WP-Recent] Error:", e);
        return [];
    }
}

/**
 * Checks if a video ID or title already exists in recent posts
 */
export function isDuplicateIdeally(sourceId: string, title: string, existingPosts: WPPost[]): { isDuplicate: boolean; reason?: string } {
    const cleanTitle = title.trim().toLowerCase();

    for (const post of existingPosts) {
        // 1. Check if sourceId exists anywhere in the raw HTML content (handles both explicit comments and iframe URLs)
        const content = post.content?.rendered || "";
        if (content.includes(sourceId)) {
            return { isDuplicate: true, reason: `Match by ID: ${sourceId}` };
        }

        // 2. Loose fallback: Check title similarity 
        const postTitle = post.title?.rendered.trim().toLowerCase();
        if (postTitle === cleanTitle) {
            return { isDuplicate: true, reason: `Match by Title: ${title}` };
        }
    }

    return { isDuplicate: false };
}

/**
 * Checks for duplicate posts specifically using automation_source_id meta field
 */
export async function checkAutomationDuplicate(sourceId: string, wpAuth: string): Promise<{ exists: boolean }> {
    try {
        // WordPress REST API doesn't support direct meta query without plugins usually, 
        // but it does natively search for strings within the post content. We send the sourceId directly!
        const res = await wpFetch(`${WP_API_URL}/posts?search=${encodeURIComponent(sourceId)}&status=publish,draft,private`, {
            headers: { 'Authorization': `Basic ${wpAuth}` },
            cache: 'no-store'
        });

        if (res.ok) {
            const posts = await res.json();
            // Verify that the search indeed found the sourceId in content/meta
            const exists = posts.some((p: any) =>
                (p.content?.rendered || "").includes(sourceId) ||
                (p.meta?.automation_source_id?.includes(sourceId)) ||
                (p.meta?.youtube_source_id === sourceId)
            );
            return { exists };
        }
        return { exists: false };
    } catch {
        return { exists: false };
    }
}

/**
 * Creates a post and requests indexing if published
 */
export async function createPostWithIndexing(
    postData: {
        title: string;
        content: string;
        status: string;
        categories?: number[];
        tags?: number[];
        featured_media?: number;
        meta?: Record<string, any>;
        slug?: string;
    },
    wpAuth: string
): Promise<WPPost | null> {
    try {
        console.log(`[WP-Create] Creating post: ${postData.title}`);

        // 1. WordPress에 글 생성
        const res = await wpFetch(`${WP_API_URL}/posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${wpAuth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`[WP-Create] Failed to create post: ${res.status}`, errorText);
            return null;
        }

        const post = await res.json();
        console.log(`[WP-Create] ✅ Post created: ID ${post.id}`);

        // 2. 발행 상태면 즉시 색인 요청
        if (post.status === 'publish' && (post.link || post.slug)) {
            // WordPress URL을 Next.js URL로 변환
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://semicolonittech.com';
            const slug = post.slug || post.link.split('/').filter((s: string) => s).pop();
            const indexUrl = `${siteUrl}/blog/${slug}`;

            console.log(`[WP-Create] 🔍 Requesting Google Indexing for: ${indexUrl}`);
            const indexed = await googlePublishUrl(indexUrl);

            if (indexed) {
                try {
                    await wpFetch(`${WP_API_URL}/posts/${post.id}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Basic ${wpAuth}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            meta: { indexing_requested_at: new Date().toISOString() }
                        })
                    });
                } catch (ignore) {
                    console.warn("[WP-Create] Failed to save indexing timestamp");
                }
            }
        }

        // Trigger Cache Revalidation for automated posts
        try {
            const { revalidateTag, revalidatePath } = require("next/cache");
            revalidateTag("posts");
            revalidatePath("/");     // Clear main page cache
            revalidatePath("/blog"); // Clear blog listing cache
        } catch (e) {
            console.log("[WP-Create] Revalidation failed (likely execution context issue):", e);
        }

        return post;

    } catch (e) {
        console.error("[WP-Create] Error:", e);
        return null;
    }
}
