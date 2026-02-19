
import 'dotenv/config';

// Inline function to avoid import issues
async function checkVideoExists(videoId: string, wpAuth: string, wpApiUrl: string): Promise<boolean> {
    try {
        if (!wpAuth) return false;

        console.log(`Fetching: ${wpApiUrl}/posts?meta_key=youtube_source_id&meta_value=${videoId}&per_page=1`);
        const res = await fetch(`${wpApiUrl}/posts?meta_key=youtube_source_id&meta_value=${videoId}&per_page=1`, {
            headers: { 'Authorization': `Basic ${wpAuth}` },
            cache: 'no-store'
        });

        if (!res.ok) {
            console.warn(`[WP-Check] Meta query failed (${res.status})`);
            return false;
        }

        const posts = await res.json();
        console.log(`[WP-Check] Returned ${posts.length} posts.`);
        if (posts.length > 0) {
            console.log(`[WP-Check] Title: ${posts[0].title.rendered}`);
            console.log(`[WP-Check] Meta: ${JSON.stringify(posts[0].meta)}`); // This might be empty unless authenticated with read scope
            console.log(`[WP-Check] Link: ${posts[0].link}`);
        }
        return posts.length > 0;
    } catch (e) {
        console.error("[WP-Check] Error:", e);
        return false;
    }
}

async function test() {
    const WP_AUTH = process.env.WP_AUTH || "";
    const WP_API_URL = process.env.WP_API_URL || "https://wp.semicolonittech.com/wp-json/wp/v2";

    // Test with specific ID: JciLeslkLvY (Jooyon Zuyoni - Galaxy Gallery Assistant)
    console.log("Checking specific video ID: JciLeslkLvY");
    const exists = await checkVideoExists("JciLeslkLvY", WP_AUTH, WP_API_URL);

    if (exists) {
        console.log("Video EXISTS on blog.");
    } else {
        console.log("Video DOES NOT EXIST on blog.");
    }
}

test();
