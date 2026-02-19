
import { config } from "dotenv";
config({ path: ".env.local" });

import { checkAutomationDuplicate } from "../src/lib/wp-server";

const WP_AUTH = (process.env.WP_AUTH || "").trim();

async function testDuplicateCheck() {
    console.log("Existing WP_AUTH:", WP_AUTH ? "Set" : "Not Set");

    // 1. Test Non-existent ID
    const randomId = `test_random_${Date.now()}`;
    console.log(`\nTesting Non-existent ID: ${randomId}`);
    const res1 = await checkAutomationDuplicate(randomId, WP_AUTH);
    console.log(`Result: exists=${res1.exists}, id=${res1.matchedPost?.id}`);

    if (res1.exists) {
        console.error("❌ ERROR: Non-existent ID returned true!");
    } else {
        console.log("✅ Correct: Non-existent ID returned false.");
    }

    // 2. Fetch a recent post to get a real automation_source_id (if possible)
    console.log("\nFetching recent posts to find a real ID...");
    const WP_API_URL = process.env.WP_API_URL || "https://wp.semicolonittech.com/wp-json/wp/v2";

    try {
        const postsRes = await fetch(`${WP_API_URL}/posts?per_page=5&_fields=id,title,meta`, {
            headers: { 'Authorization': `Basic ${WP_AUTH}` }
        });

        if (postsRes.ok) {
            const posts = await postsRes.json();
            const automationPost = posts.find((p: any) => p.meta?.automation_source_id);

            if (automationPost) {
                const realId = automationPost.meta.automation_source_id;
                console.log(`Testing Real ID from Post #${automationPost.id}: ${realId}`);

                const res2 = await checkAutomationDuplicate(realId, WP_AUTH);
                console.log(`Result: exists=${res2.exists}, id=${res2.matchedPost?.id}`);

                if (res2.exists && res2.matchedPost?.id === automationPost.id) {
                    console.log("✅ Correct: Real ID returned true and matched correct post.");
                } else {
                    console.error("❌ ERROR: Real ID check failed or matched wrong post.");
                }
            } else {
                console.log("⚠️ No recent posts with automation_source_id found.");
            }
        } else {
            console.error("Failed to fetch posts:", postsRes.status);
        }
    } catch (e) {
        console.error("Error fetching posts:", e);
    }
}

testDuplicateCheck();
