import { fetch as undiciFetch } from 'undici';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { googlePublishUrl } from '../src/lib/google-indexing';

// Load prod env
const prodContent = fs.readFileSync('.env.vercellocal', 'utf-8');
const prodConfig = dotenv.parse(prodContent);

for (const key in prodConfig) {
    process.env[key] = prodConfig[key];
}

// Load local env for missing indexing keys
try {
    const localContent = fs.readFileSync('.env.local', 'utf-8');
    const localConfig = dotenv.parse(localContent);
    for (const key in localConfig) {
        if (!process.env[key]) {
            process.env[key] = localConfig[key];
        }
    }
} catch (e) {
    console.log("No .env.local found");
}

process.env.NODE_ENV = 'production';

const WP_API_URL = 'https://wp.semicolonittech.com/wp-json/wp/v2';
const WP_AUTH = process.env.WP_AUTH;
const SITE_URL = 'https://semicolonittech.com';

async function forceGoogleIndexing() {
    console.log("Fetching all published posts...");
    let allPosts: any[] = [];
    let page = 1;
    let totalPages = 1;

    try {
        do {
            const res = await undiciFetch(`${WP_API_URL}/posts?per_page=100&page=${page}&status=publish`, {
                headers: { 'Authorization': `Basic ${WP_AUTH}` }
            });

            if (!res.ok) {
                console.error(`Failed to fetch: ${res.statusText}`);
                break;
            }

            totalPages = parseInt(res.headers.get('x-wp-totalpages') || '1', 10);
            const posts = await res.json() as any[];
            allPosts = allPosts.concat(posts);
            page++;
        } while (page <= totalPages);

        console.log(`Target: ${allPosts.length} posts to be indexed.`);

        // Google Indexing Quota is usually 200 per day. 86 is safe.
        let successCount = 0;
        let failCount = 0;

        for (const post of allPosts) {
            const slug = post.slug;
            const fullUrl = `${SITE_URL}/blog/${slug}`;

            console.log(`[Indexing] Pushing: ${fullUrl}`);
            const isSuccess = await googlePublishUrl(fullUrl);

            if (isSuccess) {
                successCount++;
            } else {
                failCount++;
            }

            // Wait 500ms between requests to avoid burst rate limits
            await new Promise(r => setTimeout(r, 500));
        }

        console.log(`\n=== Indexing Summary ===`);
        console.log(`Total Posts: ${allPosts.length}`);
        console.log(`Success: ${successCount}`);
        console.log(`Failed: ${failCount}`);

    } catch (e) {
        console.error(e);
    }
}

forceGoogleIndexing();
