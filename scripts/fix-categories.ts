
import { WPPost } from "../src/lib/wp-api";
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const WP_API_URL = process.env.WP_API_URL || "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = process.env.WP_AUTH;

// Category ID Migration Map
// "App" (ID 2) -> Correct ID
const CATEGORY_MAP: Record<string, number> = {
    // AI (ID 15)
    'ai': 15, 'gpt': 15, 'chatgpt': 15, '인공지능': 15, 'llm': 15, 'openai': 15,
    'gemini': 15, 'claude': 15, 'deepseek': 15, 'machine learning': 15,

    // Gadget (ID 4)
    'iphone': 4, 'galaxy': 4, '갤럭시': 4, '아이폰': 4, 'samsung': 4, 'apple': 4,
    'pixel': 4, 'macbook': 4, 'ipad': 4, 'watch': 4, 'fold': 4, 'flip': 4,
    'nvidia': 4, 'rtx': 4, 'gpu': 4, 'cpu': 4, 'intel': 4, 'amd': 4,

    // Software (ID 8)
    'software': 8, 'windows': 8, 'mac': 8, 'ios': 8, 'android': 8,
    'update': 8, 'chrome': 8, 'security': 8, 'cloud': 8, 'aws': 8,

    // App (ID 2)
    'app': 2, 'application': 2, '앱': 2, '어플': 2, 'kakao': 2, 'naver': 2,
    'instagram': 2, 'youtube': 2, 'tiktok': 2, 'sns': 2
};

async function getAllPosts(): Promise<WPPost[]> {
    const res = await fetch(`${WP_API_URL}/posts?per_page=100&_embed`, {
        headers: { "Authorization": `Basic ${WP_AUTH}` }
    });
    return res.json();
}

async function updatePostCategory(postId: number, categoryId: number, title: string) {
    console.log(`📝 Updating Post ${postId} ("${title}") -> Category ${categoryId}`);

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
        console.log(`✅ Success!`);
    }
}

function determineCategoryId(title: string, content: string): number {
    const allText = `${title} ${content}`.toLowerCase();

    for (const [keyword, catId] of Object.entries(CATEGORY_MAP)) {
        if (allText.includes(keyword)) {
            return catId;
        }
    }

    // Default fallback: Tech (ID 9)
    return 9;
}

async function main() {
    if (!WP_AUTH) {
        console.error("❌ WP_AUTH not found");
        return;
    }

    console.log("🔍 Fetching posts...");
    const posts = await getAllPosts();
    console.log(`📚 Found ${posts.length} posts.`);

    let updateCount = 0;

    for (const post of posts) {
        // Current Category
        const currentCatIds = post.categories || [];
        // Determine correct category
        const correctCatId = determineCategoryId(post.title.rendered, post.content.rendered);

        // If currently "App" (2) or "Uncategorized" (1) and matches something else
        const needsUpdate =
            (currentCatIds.includes(2) && correctCatId !== 2) ||
            (currentCatIds.includes(1) && correctCatId !== 1);

        if (needsUpdate) {
            await updatePostCategory(post.id, correctCatId, post.title.rendered);
            updateCount++;
            // Rate limit slightly
            await new Promise(r => setTimeout(r, 500));
        }
    }

    console.log(`🎉 Finished! Updated ${updateCount} posts.`);
}

main();
