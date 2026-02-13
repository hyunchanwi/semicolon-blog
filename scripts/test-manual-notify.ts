
import { config } from "dotenv";
config({ path: ".env.local" });

// Mock createPost to test logic without actually creating a post? 
// Or actually create a draft post to test.
// Since we modify the route, we need to call the route or mimic the logic.
// Testing the route requires running Next.js server.
// Instead, let's just create a script that mimics the logic we added to the route to ensure it works in isolation.

import { googlePublishUrl } from "../src/lib/google-indexing";
import { getVerifiedSubscribers } from "../src/lib/subscribers";
import { sendNewPostNotification } from "../src/lib/email";
import { getMedia, stripHtml } from "../src/lib/wp-api";

async function main() {
    console.log("Testing Notification Logic...");

    // Mock Data
    const post = {
        title: { rendered: "[TEST] Manual Post Notification Test" },
        excerpt: { rendered: "<p>This is a test post to verify email notifications for manual publishing.</p>" },
        slug: "test-manual-notify",
        link: "https://semicolonittech.com/blog/test-manual-notify",
        status: "publish",
        categories: [1]
    };

    const featured_media = 0; // Set valid ID if needed, 0 skips image fetch

    // Logic Copy-Paste from Route
    if (post.status === 'publish') {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semicolonittech.com";
        const postSlug = post.slug;
        const publicUrl = `${siteUrl}/blog/${postSlug}`;

        console.log(`[Admin] 📡 Indexing: ${publicUrl}`);
        // await googlePublishUrl(publicUrl); // Skip actual indexing for test

        // Send Email Notification
        let imageUrl = '';
        if (featured_media) {
            try {
                const media = await getMedia(featured_media);
                if (media?.source_url) {
                    imageUrl = media.source_url;
                }
            } catch (e) {
                console.error("[Admin] Failed to fetch media:", e);
            }
        }

        const subscribers = await getVerifiedSubscribers();
        if (subscribers.length > 0) {
            console.log(`[Admin] 📧 Sending notification to ${subscribers.length} subscribers...`);
            // await sendNewPostNotification(subscribers, {
            //     title: post.title.rendered,
            //     excerpt: stripHtml(post.excerpt.rendered).slice(0, 200) + "...",
            //     url: publicUrl,
            //     imageUrl: imageUrl || undefined
            // });
            console.log("SKIPPED actual sending to avoid spam. Logic looks good if no errors above.");
        } else {
            console.log("No subscribers found.");
        }
    }
}

main();
