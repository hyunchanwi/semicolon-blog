
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const WP_API_URL = process.env.WP_API_URL || "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = process.env.WP_AUTH;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

// Fallback image
const FALLBACK_IMAGE_URL = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200";

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

async function searchTavilyImage(query: string, apiKey: string): Promise<string | null> {
    try {
        const res = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                api_key: apiKey,
                query: query + " image",
                search_depth: "basic",
                include_images: true,
                max_results: 1
            })
        });

        if (!res.ok) return null;
        const data = await res.json();
        return data.images?.[0] || null;
    } catch {
        return null;
    }
}

async function main() {
    const WP_AUTH_VAL = process.env.WP_AUTH || WP_AUTH;
    const TAVILY_KEY_VAL = process.env.TAVILY_API_KEY || TAVILY_API_KEY;

    if (!WP_AUTH_VAL) {
        console.error("❌ WP_AUTH missing");
        return;
    }

    console.log("📥 Fetching posts without thumbnails or with fallback...");
    // Fetch recent 50 posts
    const res = await fetch(`${WP_API_URL}/posts?per_page=50&_fields=id,title,featured_media`, {
        headers: { "Authorization": `Basic ${WP_AUTH_VAL}` }
    });

    if (!res.ok) throw new Error("Failed to fetch posts");
    const posts = await res.json();

    console.log(`Found ${posts.length} posts.`);

    for (const post of posts) {
        // Condition: No featured media OR (Logic to check if fallback? difficult, assume 0 for now)
        if (post.featured_media === 0) {
            console.log(`🔍 Processing [${post.id}] ${post.title.rendered}...`);

            // 1. Find Image via Tavily
            let imageUrl = null;
            if (TAVILY_KEY_VAL) {
                imageUrl = await searchTavilyImage(post.title.rendered, TAVILY_KEY_VAL);
            }

            if (!imageUrl) {
                console.log("   ⚠️ No image found on Tavily. Using Fallback.");
                imageUrl = FALLBACK_IMAGE_URL;
            } else {
                console.log(`   Found Tavily image: ${imageUrl}`);
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
