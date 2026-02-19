
import { getRecentAutomationPosts } from "../src/lib/wp-server";

import fs from 'fs';
import path from 'path';

// Load .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const WP_AUTH = process.env.WP_AUTH || "";

async function main() {
    if (!WP_AUTH) {
        console.error("No WP_AUTH");
        return;
    }

    console.log("Fetching recent posts...");
    // We'll modify the function locally or just call the API directly to compare
    const posts = await getRecentAutomationPosts(WP_AUTH);

    console.log(`Fetched ${posts.length} posts.`);
    // We can't easily see the status from getRecentAutomationPosts result because it returns VideoCheckEntry
    // But we can check if a known private post title is in there.

    // Better yet, let's call the API directly here to see what the default behavior is
    const WP_API_URL = process.env.WP_API_URL || "https://wp.semicolonittech.com/wp-json/wp/v2";

    console.log("Fetching with default params...");
    const res = await fetch(`${WP_API_URL}/posts?per_page=10&_fields=id,title,status`, {
        headers: { 'Authorization': `Basic ${WP_AUTH}` }
    });
    const defaultPosts = await res.json();
    console.log("Default Fetch Statuses:", defaultPosts.map((p: any) => p.status));

    console.log("Fetching with status=any...");
    const resAny = await fetch(`${WP_API_URL}/posts?per_page=10&status=any&_fields=id,title,status`, {
        headers: { 'Authorization': `Basic ${WP_AUTH}` }
    });
    const anyPosts = await resAny.json();
    console.log("Any Fetch Statuses:", anyPosts.map((p: any) => p.status));
}

main();
