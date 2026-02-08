
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const WP_API_URL = process.env.WP_API_URL || "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const WP_AUTH = process.env.WP_AUTH; // Passed via env var in command

async function findKevinWarshPost() {
    console.log("🔍 Searching for Kevin Warsh post...");
    const res = await fetch(`${WP_API_URL}/posts?search=케빈 워시&_embed`, {
        headers: { "Authorization": `Basic ${WP_AUTH}` }
    });

    if (!res.ok) {
        throw new Error(`Failed to search: ${res.status} ${await res.text()}`);
    }

    const posts = await res.json();
    return posts;
}

async function updatePostCategory(postId: number, categoryId: number, title: string) {
    console.log(`📝 Updating Post ${postId} ("${title}") -> Category ${categoryId} (Tech)`);

    const res = await fetch(`${WP_API_URL}/posts/${postId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${WP_AUTH}`
        },
        body: JSON.stringify({
            categories: [categoryId]
        })
    });

    if (!res.ok) {
        console.error(`❌ Failed to update post ${postId}: ${await res.text()}`);
    } else {
        console.log(`✅ Success! Post recategorized.`);
    }
}

async function main() {
    if (!WP_AUTH) {
        console.error("❌ WP_AUTH not found in env");
        // We will pass it via command line
        return;
    }

    try {
        const posts = await findKevinWarshPost();

        if (posts.length === 0) {
            console.log("⚠️ No post found matching '케빈 워시'");
            return;
        }

        for (const post of posts) {
            console.log(`Found post: ${post.id} - ${post.title.rendered}`);
            // Move to Tech (ID 9)
            await updatePostCategory(post.id, 9, post.title.rendered);
        }

    } catch (e) {
        console.error(e);
    }
}

main();
