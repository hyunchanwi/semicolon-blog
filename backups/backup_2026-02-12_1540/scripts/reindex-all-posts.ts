
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { googlePublishUrl } from '../src/lib/google-indexing';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') }); // or .env.prod

const WP_API_URL = process.env.WP_API_URL || "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://semicolonittech.com";
const WP_AUTH = process.env.WP_AUTH;

async function getAllPosts() {
    let allPosts: any[] = [];
    let page = 1;
    const perPage = 50;

    while (true) {
        console.log(`Fetching posts page ${page}...`);
        const res = await fetch(`${WP_API_URL}/posts?per_page=${perPage}&page=${page}&_fields=id,slug,title,link,date`, {
            headers: {
                'Authorization': `Basic ${WP_AUTH}`
            }
        });

        if (!res.ok) {
            if (res.status === 400) break; // End of list
            console.error(`Failed to fetch posts: ${res.statusText}`);
            break;
        }

        const posts = await res.json();
        if (posts.length === 0) break;

        allPosts = allPosts.concat(posts);
        console.log(`Fetched ${posts.length} posts.`);

        // Safety break
        if (page > 10) break;
        page++;
    }

    return allPosts;
}

async function reindexAll() {
    console.log("🚀 Starting Bulk Re-indexing...");

    if (!process.env.GOOGLE_INDEXING_CLIENT_EMAIL || !process.env.GOOGLE_INDEXING_PRIVATE_KEY) {
        console.error("❌ Google Indexing Credentials missing in .env");
        return;
    }

    const posts = await getAllPosts();
    console.log(`Found total ${posts.length} posts.`);

    let successCount = 0;
    let failCount = 0;

    for (const post of posts) {
        const slug = post.slug;
        if (!slug) continue;

        const publicUrl = `${SITE_URL}/blog/${slug}`;
        console.log(`Processing: ${publicUrl} (${post.title.rendered})`);

        // Add delay to avoid rate limits
        await new Promise(r => setTimeout(r, 500));

        try {
            const res = await googlePublishUrl(publicUrl);
            if (res) {
                // console.log(`✅ Indexed: ${publicUrl}`); 
                // googlePublishUrl already logs
                successCount++;
            } else {
                failCount++;
            }
        } catch (e) {
            console.error(`❌ Error indexing ${publicUrl}:`, e);
            failCount++;
        }
    }

    console.log(`\n🎉 Completed! Success: ${successCount}, Failed: ${failCount}`);
}

reindexAll();
