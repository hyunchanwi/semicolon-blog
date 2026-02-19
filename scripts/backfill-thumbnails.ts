
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const WP_API_URL = process.env.WP_API_URL || "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = process.env.WP_AUTH;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

// Fallback image if Unsplash fails
const FALLBACK_IMAGE_URL = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200";

// Copy of upload logic since we can't easily import from lib in standalone script without ts-node-paths setup often
async function uploadImageFromUrl(imageUrl: string, title: string, wpAuth: string): Promise<number | null> {
    try {
        console.log(`   [Upload] Downloading: ${imageUrl}`);
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) return null;

        const buffer = await imgRes.arrayBuffer();
        const blob = new Blob([buffer], { type: imgRes.headers.get("content-type") || "image/jpeg" });
        const filename = `${title.replace(/[^a-zA-Z0-9가-힣]/g, '-').slice(0, 30)}-${Date.now()}.jpg`;

        const formData = new FormData();
        formData.append('file', blob, filename);
        formData.append('title', title);
        formData.append('alt_text', title);

        const uploadRes = await fetch(`${WP_API_URL}/media`, {
            method: 'POST',
            headers: { 'Authorization': `Basic ${wpAuth}` },
            body: formData
        });

        if (!uploadRes.ok) throw new Error(await uploadRes.text());
        const data = await uploadRes.json();
        return data.id;
    } catch (e) {
        console.error("   [Upload] Error:", e);
        return null;
    }
}

async function searchUnsplash(query: string): Promise<string | null> {
    if (!UNSPLASH_ACCESS_KEY) return null;
    try {
        // Translation fallback (simplified)
        let q = query;
        if (q.includes('AI')) q = 'artificial intelligence';
        if (q.includes('삼성')) q = 'samsung';
        if (q.includes('애플')) q = 'apple';
        if (q.includes('비트코인')) q = 'bitcoin';

        const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=1&orientation=landscape`, {
            headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` }
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.results?.[0]?.urls?.regular || null;
    } catch {
        return null;
    }
}

async function main() {
    const WP_AUTH_VAL = process.env.WP_AUTH || WP_AUTH;
    const UNSPLASH_KEY_VAL = process.env.UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY;

    if (!WP_AUTH_VAL) {
        console.error("❌ WP_AUTH missing");
        return;
    }

    console.log("📥 Fetching posts without thumbnails...");
    // Fetch posts, ideally filter by missing featured_media if possible, but API doesn't support easy filter by null.
    // Fetch recent 100 posts
    const res = await fetch(`${WP_API_URL}/posts?per_page=50&_fields=id,title,featured_media`, {
        headers: { "Authorization": `Basic ${WP_AUTH_VAL}` }
    });

    if (!res.ok) throw new Error("Failed to fetch posts");
    const posts = await res.json();

    console.log(`Found ${posts.length} posts.`);

    for (const post of posts) {
        if (post.featured_media === 0) {
            console.log(`🔍 Processing [${post.id}] ${post.title.rendered}...`);

            // 1. Find Image
            let imageUrl = null;
            if (UNSPLASH_KEY_VAL) {
                imageUrl = await searchUnsplash(post.title.rendered);
            }

            if (!imageUrl) {
                console.log("   ⚠️ No image found on Unsplash (or key missing). Using Fallback.");
                imageUrl = FALLBACK_IMAGE_URL;
            } else {
                console.log(`   Found image: ${imageUrl}`);
            }

            // 2. Upload to WP
            const mediaId = await uploadImageFromUrl(imageUrl, post.title.rendered, WP_AUTH_VAL);
            if (!mediaId) {
                console.log("   ❌ Upload failed");
                continue;
            }

            // 3. Update Post
            const updateRes = await fetch(`${WP_API_URL}/posts/${post.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${WP_AUTH_VAL}`
                },
                body: JSON.stringify({ featured_media: mediaId })
            });

            if (updateRes.ok) {
                console.log(`   ✅ Updated! Media ID: ${mediaId}`);
            } else {
                console.error(`   ❌ Update failed: ${await updateRes.text()}`);
            }
        }
    }
}

main();
