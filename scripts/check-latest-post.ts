
import { config } from "dotenv";
config({ path: ".env.local" });

const WP_API_URL = process.env.WP_API_URL || "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";

async function checkLatestPostTime() {
    try {
        console.log("Fetching latest post...");
        const res = await fetch(`${WP_API_URL}/posts?per_page=1&_embed`);
        const posts = await res.json();

        if (posts.length > 0) {
            const p = posts[0];
            console.log("---------------------------------------------------");
            console.log(`Title: ${p.title.rendered}`);
            console.log(`ID: ${p.id}`);
            console.log(`Date (Local WP): ${p.date}`);
            console.log(`Date (GMT): ${p.date_gmt}`);
            console.log(`Modified: ${p.modified}`);
            console.log(`Slug: ${p.slug}`);
            console.log(`Link: ${p.link}`);
            if (p.meta) {
                console.log(`Meta Source ID: ${p.meta.automation_source_id || 'N/A'}`);
            }
            console.log("---------------------------------------------------");
        } else {
            console.log("No posts found.");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

checkLatestPostTime();
