
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

const WP_API_URL = process.env.WP_API_URL || "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const WP_AUTH = process.env.WP_AUTH;

async function checkMetaField() {
    if (!WP_AUTH) {
        console.error("❌ WP_AUTH not set");
        return;
    }

    console.log("🔍 Checking WordPress REST API for custom meta fields...");

    // Fetch latest post with _fields=id,title,meta
    const res = await fetch(`${WP_API_URL}/posts?per_page=1&_fields=id,title,meta`, {
        headers: { 'Authorization': `Basic ${WP_AUTH}` }
    });

    if (!res.ok) {
        console.error(`❌ Failed to fetch: ${res.status} ${await res.text()}`);
        return;
    }

    const posts = await res.json();
    if (posts.length === 0) {
        console.log("⚠️ No posts found.");
        return;
    }

    const post = posts[0];
    console.log(`✅ Fetched Post ID: ${post.id}`);
    console.log(`✅ Title: ${post.title.rendered}`);
    console.log("✅ Meta Fields:", JSON.stringify(post.meta, null, 2));

    // Check specific fields
    const requiredFields = ['automation_source_id', 'youtube_source_id', 'youtube_channel', 'indexing_requested_at'];
    const missing = requiredFields.filter(f => !post.meta.hasOwnProperty(f));

    if (missing.length === 0) {
        console.log("\n🎉 SUCCESS: All custom meta fields are exposed!");
    } else {
        console.log(`\n⚠️ WARNING: Some fields are missing in 'meta': ${missing.join(', ')}`);
        console.log("👉 functions.php modification might not be applied or the post doesn't have these values yet.");
    }
}

checkMetaField();
