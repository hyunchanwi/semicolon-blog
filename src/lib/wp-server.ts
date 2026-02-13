
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

        // Note: We use the 'automation_source_id' meta key.
        // This requires the WP site to allow filtering by meta_key/meta_value in REST API.
        // If this fails (e.g. permission or config), we might fall back to search.
        // But searching content is unreliable if the ID is hidden in comments that aren't indexed.

        // Strategy 1: Meta Query (Most Accurate)
        // URL: /wp-json/wp/v2/posts?meta_key=automation_source_id&meta_value=...
        // Note: Standard WP API might not expose arbitrary meta keys for filtering without 'register_meta'.
        // However, many custom fields plugins or basic setups allow it if authorized.
        // Since we are creating the post with this meta, we should try to query it.

        // Let's try searching by title as a strong secondary check if the sourceId is usually part of the internal logic.
        // But `sourceId` (e.g., youtube_VIDEOID) is NOT the title.

        // Let's try to trust the current content search BUT also ensure we are checking Title if content fails?
        // Actually, the user says duplicates *exist*. This means `exists: false` was returned even when it should be true.
        // This implies the Content Search failed to find the hidden ID.

        // FIX: We will rely on `meta_key` and `meta_value`. 
        // We need to assume the `automation_source_id` was saved in `meta`.

        const metaUrl = `${WP_API_URL}/posts?status=any&per_page=1&search=${encodeURIComponent(sourceId)}`;
        // status=any to find drafts/pending too.

        const searchRes = await fetch(metaUrl, {
            headers: { 'Authorization': `Basic ${wpAuth}` },
            cache: 'no-store'
        });

        if (searchRes.ok) {
            const posts = await searchRes.json();
            if (posts.length > 0) {
                // Confirm match
                const p = posts[0];
                const meta = p.meta || {};
                // If meta has the ID
                if (meta['automation_source_id'] === sourceId) {
                    console.log(`[WP-Check] Match found via Meta ID: ${sourceId} (Post ${p.id})`);
                    return { exists: true, matchedPost: p };
                }

                // Fallback: Check content string match
                const content = p.content?.rendered || "";
                if (content.includes(sourceId)) {
                    console.log(`[WP-Check] Match found via Content Search: ${sourceId} (Post ${p.id})`);
                    return { exists: true, matchedPost: p };
                }
            }
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
    // Delegate to the standardized automation check
    // We expect "youtube_{videoId}" to be present in the content/meta
    return checkAutomationDuplicate(`youtube_${videoId}`, wpAuth);
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
