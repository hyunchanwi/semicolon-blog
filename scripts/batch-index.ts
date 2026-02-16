
import { googlePublishUrl } from '../src/lib/google-indexing';
import fs from 'fs';
import path from 'path';

// Load .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        // Handle value possibly containing '=' (base64)
        const firstEqual = line.indexOf('=');
        if (firstEqual === -1) return;

        const key = line.substring(0, firstEqual).trim();
        let value = line.substring(firstEqual + 1).trim();

        // Remove surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        if (key && value) {
            process.env[key] = value;
        }
    });
}

const WP_API_URL = process.env.WP_API_URL || "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const WP_AUTH = process.env.WP_AUTH;
const NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://semicolonittech.com';

async function batchIndexExistingPosts() {
    if (!WP_AUTH) {
        console.error("❌ WP_AUTH not found in environment.");
        return;
    }

    console.log('🔍 Starting batch indexing for existing posts...\n');

    // Fetch posts published after 2026-02-10 (or adjust date as needed)
    // User mentioned "past posts unknown if indexed".
    // Let's fetch recent 50 posts to be safe and sure.
    const res = await fetch(
        `${WP_API_URL}/posts?status=publish&per_page=50`,
        {
            headers: { 'Authorization': `Basic ${WP_AUTH}` }
        }
    );

    if (!res.ok) {
        console.error(`❌ Failed to fetch posts: ${res.status}`);
        return;
    }

    const posts = await res.json();
    console.log(`📊 Found ${posts.length} posts to check/index.\n`);

    let successCount = 0;
    let failCount = 0;

    for (const post of posts) {
        const slug = post.slug || post.link.split('/').filter((s: string) => s).pop();
        const url = `${NEXT_PUBLIC_SITE_URL}/blog/${slug}`;

        try {
            console.log(`📝 [${post.id}] ${post.title.rendered}`);

            // Optional: Check if already indexed? No API for that easily (only GSC API, different scope).
            // Just publish again. Google Indexing API allows updates.

            const result = await googlePublishUrl(url);

            if (result) {
                console.log(`   ✅ Indexed: ${url}`);

                // Update Meta
                try {
                    await fetch(`${WP_API_URL}/posts/${post.id}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Basic ${WP_AUTH}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            meta: { indexing_requested_at: new Date().toISOString() }
                        })
                    });
                    console.log(`   🕒 Meta Updated: indexing_requested_at`);
                    successCount++;
                } catch (metaErr) {
                    console.error(`   ⚠️ Failed to update meta:`, metaErr);
                }
                console.log(''); // Newline
            } else {
                console.log(`   ⚠️ Failed: ${url} (Creds or Quota)\n`);
                failCount++;
            }

            // Rate limit protection
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error: any) {
            console.error(`   ❌ Error: ${error.message}\n`);
            failCount++;
        }
    }

    console.log('\n📈 Batch Indexing Complete');
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
}

batchIndexExistingPosts();
