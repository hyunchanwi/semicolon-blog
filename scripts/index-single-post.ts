
import { googlePublishUrl } from '../src/lib/google-indexing';
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
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://semicolonittech.com';

async function indexSinglePost(postId: number) {
    if (!WP_AUTH) {
        console.error("❌ WP_AUTH not set");
        return;
    }

    console.log(`🔍 Fetching Post ID: ${postId}...`);

    try {
        const res = await fetch(`${WP_API_URL}/posts/${postId}`, {
            headers: { 'Authorization': `Basic ${WP_AUTH}` }
        });

        if (!res.ok) {
            console.error(`❌ Failed to fetch post: ${res.status}`);
            return;
        }

        const post = await res.json();
        const slug = post.slug || post.link.split('/').filter((s: string) => s).pop();
        const url = `${SITE_URL}/blog/${slug}`;

        console.log(`📝 Processing: ${post.title.rendered}`);
        console.log(`🔗 Target URL: ${url}`);

        const result = await googlePublishUrl(url);

        if (result) {
            console.log(`✅ Indexed Successfully: ${url}`);

            // Update Meta
            await fetch(`${WP_API_URL}/posts/${postId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${WP_AUTH}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    meta: { indexing_requested_at: new Date().toISOString() }
                })
            });
            console.log(`🕒 Meta Updated: indexing_requested_at`);
        } else {
            console.error(`❌ Indexing Failed for ${url}`);
        }

    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
    }
}

// Target ID from previous check
indexSinglePost(3397);
