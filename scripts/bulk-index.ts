
import { googlePublishUrl } from "../src/lib/google-indexing";
import { config } from "dotenv";
config({ path: ".env.local" });

const WP_API_URL = process.env.WP_API_URL || "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://semicolonittech.com";

async function bulkIndex() {
    console.log("🚀 Starting Bulk Indexing...");

    try {
        // Fetch all posts (published)
        // Paging handling: simple loop until no more posts
        let page = 1;
        let allPosts: any[] = [];

        while (true) {
            console.log(`Fetching page ${page}...`);
            const res = await fetch(`${WP_API_URL}/posts?per_page=100&page=${page}&status=publish&_fields=id,slug,link`);

            if (!res.ok) {
                // likely 400 Bad Request if page out of range
                break;
            }

            const posts = await res.json();
            if (posts.length === 0) break;

            allPosts = allPosts.concat(posts);
            page++;
        }

        console.log(`Found ${allPosts.length} posts. Starting indexing requests...`);
        console.log("---------------------------------------------------");

        let successCount = 0;
        let failCount = 0;

        // Process in chunks to avoid rate limits (Google Indexing API has quotas)
        // Quota is usually 200 per day for normal accounts, but higher for service accounts.
        // Let's do it sequentially with a small delay.

        for (const post of allPosts) {
            const slug = post.slug || post.link.split('/').filter((s: string) => s).pop();
            const publicUrl = `${SITE_URL}/blog/${slug}`;

            console.log(`[${successCount + failCount + 1}/${allPosts.length}] Requesting: ${publicUrl}`);

            try {
                // Add delay to be gentle
                await new Promise(r => setTimeout(r, 500));

                const result = await googlePublishUrl(publicUrl);
                if (result) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (e) {
                console.error(`❌ Failed: ${publicUrl}`, e);
                failCount++;
            }
        }

        console.log("---------------------------------------------------");
        console.log(`✅ Bulk Indexing Completed.`);
        console.log(`Success: ${successCount}`);
        console.log(`Failed: ${failCount}`);

    } catch (e) {
        console.error("Critical Error:", e);
    }
}

bulkIndex();
