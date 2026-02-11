
import { WPPost } from "./wp-api";

const WP_API_URL = process.env.WP_API_URL || "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";

/**
 * Uploads an image from a URL to WordPress Media Library
 * @param imageUrl The URL of the image to download
 * @param title Title for the media item
 * @param wpAuth WordPress Basic Auth string
 * @returns Object with ID and URL or null if failed
 */
export async function uploadImageFromUrl(imageUrl: string, title: string, wpAuth: string): Promise<{ id: number; url: string } | null> {
    try {
        console.log(`[WP-Upload] Downloading: ${imageUrl}`);
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) {
            console.error(`[WP-Upload] Failed to download image: ${imgRes.status}`);
            return null;
        }

        const buffer = await imgRes.arrayBuffer();
        const blob = new Blob([buffer], { type: imgRes.headers.get("content-type") || "image/jpeg" });

        // Clean filename
        const filename = `${title.replace(/[^a-zA-Z0-9가-힣]/g, '-').slice(0, 30)}-${Date.now()}.jpg`;

        const formData = new FormData();
        formData.append('file', blob, filename);
        formData.append('title', title);
        formData.append('alt_text', title);

        console.log(`[WP-Upload] Uploading to WordPress as ${filename}...`);
        const uploadRes = await fetch(`${WP_API_URL}/media`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${wpAuth}`
            },
            body: formData
        });

        if (!uploadRes.ok) {
            console.error(`[WP-Upload] Upload failed: ${await uploadRes.text()}`);
            return null;
        }

        const data = await uploadRes.json();
        console.log(`[WP-Upload] Success! Media ID: ${data.id}`);
        return {
            id: data.id,
            url: data.source_url // WordPress provided URL
        };

    } catch (e) {
        console.error("[WP-Upload] Error:", e);
        return null;
    }
}

/**
 * Get or Create a WordPress Tag by Name
 */
export async function getOrCreateTag(tagName: string, wpAuth: string): Promise<number | null> {
    try {
        // 1. Search for existing tag
        const searchRes = await fetch(`${WP_API_URL}/tags?search=${encodeURIComponent(tagName)}`, {
            headers: { 'Authorization': `Basic ${wpAuth}` }
        });

        if (searchRes.ok) {
            const tags = await searchRes.json();
            const existing = tags.find((t: any) => t.name.toLowerCase() === tagName.toLowerCase());
            if (existing) return existing.id;
        }

        // 2. Create new tag if not found
        console.log(`[WP-Tag] Creating new tag: ${tagName}`);
        const createRes = await fetch(`${WP_API_URL}/tags`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${wpAuth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: tagName })
        });

        if (createRes.ok) {
            const newTag = await createRes.json();
            return newTag.id;
        }

        return null;
        return null;
    } catch (e) {
        console.error("[WP-Tag] Error:", e);
        return null;
    }
}

/**
 * Check if a post exists by a unique Automation Source ID (Standardized)
 */
export async function checkAutomationDuplicate(sourceId: string, wpAuth: string): Promise<{ exists: boolean; matchedPost?: any }> {
    try {
        if (!wpAuth || !sourceId) return { exists: false };

        console.log(`[WP-Check] Checking duplicate for: ${sourceId}`);

        // 1. Try Meta Key Search first
        const encodedSourceId = encodeURIComponent(sourceId);
        const metaRes = await fetch(`${WP_API_URL}/posts?meta_key=automation_source_id&meta_value=${encodedSourceId}&per_page=1`, {
            headers: { 'Authorization': `Basic ${wpAuth}` },
            cache: 'no-store'
        });

        if (metaRes.ok) {
            const posts = await metaRes.json();
            if (posts.length > 0) {
                console.log(`[WP-Check] Match found via Meta: ${sourceId}`);
                return { exists: true, matchedPost: posts[0] };
            }
        }

        // 2. Try Content Search (Hidden ID in HTML comment)
        // WordPress search indexed content, including comments.
        const searchRes = await fetch(`${WP_API_URL}/posts?search=${encodedSourceId}&per_page=1`, {
            headers: { 'Authorization': `Basic ${wpAuth}` },
            cache: 'no-store'
        });

        if (searchRes.ok) {
            const posts = await searchRes.json();
            if (posts.length > 0) {
                const p = posts[0];
                const content = p.content?.rendered || "";
                if (content.includes(sourceId)) {
                    console.log(`[WP-Check] Match found via Content Search: ${sourceId}`);
                    return { exists: true, matchedPost: p };
                }
            }
        }

        // Legacy Fallback for YouTube
        if (sourceId.startsWith('youtube_')) {
            const videoId = sourceId.replace('youtube_', '');
            return checkVideoExists(videoId, wpAuth);
        }

        return { exists: false };
    } catch (e) {
        console.error("[WP-Check] Duplicate check error:", e);
        return { exists: false };
    }
}

/**
 * Check if a YouTube video has already been posted based on metadata
 */
export async function checkVideoExists(videoId: string, wpAuth: string): Promise<{ exists: boolean; matchedPost?: any }> {
    try {
        if (!wpAuth) return { exists: false };

        const res = await fetch(`${WP_API_URL}/posts?meta_key=youtube_source_id&meta_value=${videoId}&per_page=1`, {
            headers: { 'Authorization': `Basic ${wpAuth}` },
            cache: 'no-store'
        });

        if (res.ok) {
            const posts = await res.json();
            if (posts.length > 0) return { exists: true, matchedPost: posts[0] };
        }

        const searchRes = await fetch(`${WP_API_URL}/posts?search=${videoId}&per_page=1`, {
            headers: { 'Authorization': `Basic ${wpAuth}` },
            cache: 'no-store'
        });

        if (searchRes.ok) {
            const searchPosts = await searchRes.json();
            if (searchPosts.length > 0) {
                const p = searchPosts[0];
                if (p.content.rendered.includes(videoId)) return { exists: true, matchedPost: p };
            }
        }

        return { exists: false };
    } catch (e) {
        return { exists: false };
    }
}

/**
 * Check if a post exists by Title (Strong Duplicate Check)
 */
export async function checkPostExistsByTitle(title: string, wpAuth: string): Promise<boolean> {
    try {
        const res = await fetch(`${WP_API_URL}/posts?search=${encodeURIComponent(title)}&per_page=1`, {
            headers: { 'Authorization': `Basic ${wpAuth}` },
            cache: 'no-store'
        });
        if (res.ok) {
            const posts = await res.json();
            if (posts.length > 0) {
                const p = posts[0];
                if (p.title.rendered.includes(title) || title.includes(p.title.rendered)) {
                    return true;
                }
            }
        }
        return false;
    } catch (e) {
        return false;
    }
}
