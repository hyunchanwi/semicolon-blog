import { fetch as undiciFetch } from 'undici';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load env
const envContent = fs.readFileSync('.env.prod', 'utf-8');
const envConfig = dotenv.parse(envContent);
const WP_API_URL = 'https://wp.semicolonittech.com/wp-json/wp/v2';
const WP_AUTH = envConfig.WP_AUTH;
const SITE_URL = envConfig.NEXT_PUBLIC_SITE_URL || 'https://semicolonittech.com';

async function checkIndexingStatus() {
    console.log("Fetching all published posts from WordPress...");
    let allPosts: any[] = [];
    let page = 1;
    let totalPages = 1;

    try {
        do {
            const res = await undiciFetch(`${WP_API_URL}/posts?per_page=100&page=${page}&status=publish`, {
                headers: { 'Authorization': `Basic ${WP_AUTH}` }
            });

            if (!res.ok) {
                console.error(`Failed to fetch page ${page}: ${res.statusText}`);
                break;
            }

            totalPages = parseInt(res.headers.get('x-wp-totalpages') || '1', 10);
            const posts = await res.json() as any[];
            allPosts = allPosts.concat(posts);
            console.log(`Fetched page ${page}/${totalPages} (${posts.length} posts)`);
            page++;
        } while (page <= totalPages);

        console.log(`\nTotal posts found: ${allPosts.length}`);

        let indexedCount = 0;
        let unindexedCount = 0;
        let missingMetaPosts = [];

        for (const post of allPosts) {
            // Check if our custom meta 'indexing_requested_at' exists
            // Note: WP REST API only exposes meta fields that are explicitly registered.
            // If it's not exposed, we might not see it here, but let's check.
            const meta = post.meta || {};
            if (meta.indexing_requested_at) {
                indexedCount++;
            } else {
                unindexedCount++;
                missingMetaPosts.push(post.id);
            }
        }

        console.log(`\n--- Indexing Notification Status ---`);
        console.log(`Total Published Posts: ${allPosts.length}`);
        console.log(`Posts with Indexing Requested Meta: ${indexedCount}`);
        console.log(`Posts without Meta (May not have been notified): ${unindexedCount}`);

        if (unindexedCount > 0) {
            console.log(`Sample unindexed post IDs (up to 5): ${missingMetaPosts.slice(0, 5).join(', ')}`);
        }

    } catch (e) {
        console.error("Error checking posts:", e);
    }
}

checkIndexingStatus();
