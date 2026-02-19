
import { config } from "dotenv";
config({ path: ".env.local" });

const WP_API_URL = process.env.WP_API_URL || "https://wp.semicolonittech.com/wp-json/wp/v2";

async function inspectPost() {
    try {
        console.log("Searching for post...");
        const res = await fetch(`${WP_API_URL}/posts?search=2026년 갤럭시와 윈도우 연동의 진화&_embed`);

        if (!res.ok) {
            console.error("Failed to fetch posts:", res.status);
            return;
        }

        const posts = await res.json();

        if (posts.length === 0) {
            console.log("❌ Post not found.");
            return;
        }

        const post = posts[0];
        console.log(`✅ Found post: [${post.id}] ${post.title.rendered}`);

        console.log("Featured Media ID:", post.featured_media);
        if (post.featured_media === 0) {
            console.log("❌ No featured media assigned.");
        } else if (post._embedded && post._embedded['wp:featuredmedia']) {
            const media = post._embedded['wp:featuredmedia'][0];
            console.log("✅ Featured Media URL:", media.source_url);
            console.log("   Media Details:", JSON.stringify(media.media_details, null, 2));
        } else {
            console.log("⚠️ Featured media ID exists but embedded data is missing.");
            // Try fetching media directly
            const mediaRes = await fetch(`${WP_API_URL}/media/${post.featured_media}`);
            if (mediaRes.ok) {
                const mediaData = await mediaRes.json();
                console.log("   Direct Fetch URL:", mediaData.source_url);
            } else {
                console.log("   ❌ Failed to fetch media details directly.");
            }
        }

        // Check if content has image
        const content = post.content.rendered;
        const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch) {
            console.log("ℹ️ First image in content:", imgMatch[1]);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

inspectPost();
