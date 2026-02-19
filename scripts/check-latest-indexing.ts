
import { config } from "dotenv";
config({ path: ".env.local" });

import { googlePublishUrl } from "../src/lib/google-indexing";

const WP_API_URL = process.env.WP_API_URL || "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = process.env.WP_AUTH;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://semicolonittech.com";

async function main() {
    if (!WP_AUTH) {
        console.error("WP_AUTH missing.");
        return;
    }

    console.log("Fetching latest post from WordPress...");
    try {
        const res = await fetch(`${WP_API_URL}/posts?per_page=1&_fields=id,title,slug,link,date`, {
            headers: {
                'Authorization': `Basic ${WP_AUTH}`
            },
            cache: 'no-store'
        });

        if (!res.ok) {
            console.error(`Failed to fetch posts: ${res.status} ${res.statusText}`);
            return;
        }

        const posts = await res.json();
        if (posts.length === 0) {
            console.log("No posts found.");
            return;
        }

        const latestPost = posts[0];
        console.log(`Latest Post Found: "${latestPost.title.rendered}" (ID: ${latestPost.id})`);
        console.log(`Published Date: ${latestPost.date}`);

        // Construct Public URL
        // Priority: Slug > Link
        const slug = latestPost.slug;
        const publicUrl = `${SITE_URL}/blog/${slug}`;

        console.log(`Target URL: ${publicUrl}`);
        console.log("Sending Indexing Request...");

        const result = await googlePublishUrl(publicUrl);

        if (result) {
            console.log("✅ Indexing Request Successfully Sent!");
            console.log(`Google API Response: ${JSON.stringify(result)}`);
        } else {
            console.error("❌ Indexing Request Failed.");
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
