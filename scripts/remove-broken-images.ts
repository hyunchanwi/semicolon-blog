
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const firstEqual = line.indexOf('=');
        if (firstEqual === -1) return;
        const key = line.substring(0, firstEqual).trim();
        let value = line.substring(firstEqual + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (key && value) process.env[key] = value;
    });
}

const WP_API_URL = process.env.WP_API_URL || "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = process.env.WP_AUTH;

async function removeBrokenImages() {
    if (!WP_AUTH) {
        console.error("❌ WP_AUTH not set");
        return;
    }

    console.log("🔍 Scanning recent posts for broken images...");

    try {
        // Fetch recent 20 posts
        const res = await fetch(`${WP_API_URL}/posts?per_page=20`, {
            headers: { 'Authorization': `Basic ${WP_AUTH}` }
        });

        if (!res.ok) {
            console.error(`❌ Failed to fetch: ${res.status}`);
            return;
        }

        const posts = await res.json();
        let fixedCount = 0;

        for (const post of posts) {
            const content = post.content.rendered;

            // Regex to match img tags
            // We want to capture the src to check it
            // Capture groups: 1=before src, 2=src quote, 3=url, 4=after url
            const imgGlobalRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;

            let newContent = content;
            let modified = false;
            let matches = [...content.matchAll(imgGlobalRegex)];

            for (const match of matches) {
                const fullTag = match[0];
                const src = match[1];

                // Allowed domains
                const isUnsplash = src.includes("unsplash.com");
                const isLocal = src.includes("semicolonittech.com") || src.includes("hostingersite.com");
                const isWpContent = src.includes("/wp-content/");

                if (!isUnsplash && !isLocal && !isWpContent) {
                    console.log(`[Post ${post.id}] 🗑️ Removing suspicious image: ${src}`);
                    // Remove the figure tag if it's wrapped in one, or just the img tag
                    // Simple replacement of the tag
                    newContent = newContent.replace(fullTag, "");

                    // Also try to remove empty figure tags left behind <figure ...><figcaption>...</figcaption></figure>
                    // But that's harder with regex. Let's just remove the img tag first.
                    modified = true;
                }
            }

            // Cleanup empty figures (naive)
            if (modified) {
                // Remove figures that have no img inside (optional, might be risky if they have other content)
                // content = content.replace(/<figure[^>]*>\s*<figcaption>.*?<\/figcaption>\s*<\/figure>/gs, "");
            }

            if (modified) {
                console.log(`[Post ${post.id}] 💾 Updating content...`);
                const updateRes = await fetch(`${WP_API_URL}/posts/${post.id}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${WP_AUTH}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        content: newContent
                    })
                });

                if (updateRes.ok) {
                    console.log(`[Post ${post.id}] ✅ Fixed!`);
                    fixedCount++;
                } else {
                    console.error(`[Post ${post.id}] ❌ Failed to update: ${updateRes.status}`);
                }
            }
        }

        console.log(`\n✨ Done! Fixed ${fixedCount} posts.`);

    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
    }
}

removeBrokenImages();
