
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

async function inspectLatestPost() {
    if (!WP_AUTH) {
        console.error("❌ WP_AUTH not set");
        return;
    }

    try {
        // Fetch latest post
        const res = await fetch(`${WP_API_URL}/posts?per_page=1`, {
            headers: { 'Authorization': `Basic ${WP_AUTH}` }
        });

        if (!res.ok) {
            console.error(`❌ Failed to fetch: ${res.status}`);
            return;
        }

        const posts = await res.json();
        if (posts.length === 0) {
            console.log("No posts found.");
            return;
        }

        const post = posts[0];
        console.log(`🔍 inspecting Post: [${post.id}] ${post.title.rendered}`);
        console.log(`🔗 Link: ${post.link}`);

        const content = post.content.rendered;

        // Find all img tags
        const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
        let match;

        console.log("\n🖼️  Found Images:");
        while ((match = imgRegex.exec(content)) !== null) {
            console.log(` - SRC: ${match[1]}`);

            // Check if contains alt
            const altMatch = match[0].match(/alt="([^"]*)"/);
            if (altMatch) console.log(`   ALT: ${altMatch[1]}`);

            // Log full tag for context
            console.log(`   TAG: ${match[0]}\n`);
        }

        if (!content.match(imgRegex)) {
            console.log("⚠️ No images found in content.");
        }

        // Also print a snippet of content to see if there are placeholders
        console.log("\n📄 Content Snippet (first 500 chars):");
        console.log(content.substring(0, 500));

    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
    }
}

inspectLatestPost();
