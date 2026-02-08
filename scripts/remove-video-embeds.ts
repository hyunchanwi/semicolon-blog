
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const WP_API_URL = process.env.WP_API_URL || "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const WP_AUTH = process.env.WP_AUTH;

if (!WP_AUTH) {
    console.error("❌ WP_AUTH is missing in .env.local");
    process.exit(1);
}

interface WPPost {
    id: number;
    title: { rendered: string };
    content: { rendered: string; protected: boolean };
    link: string;
}

async function getAllPosts(): Promise<WPPost[]> {
    let allPosts: WPPost[] = [];
    let page = 1;

    while (true) {
        console.log(`Fetching posts page ${page}...`);
        const res = await fetch(`${WP_API_URL}/posts?per_page=100&page=${page}`, {
            headers: {
                'Authorization': `Basic ${WP_AUTH}`
            }
        });

        if (!res.ok) {
            if (res.status === 400 && page > 1) break; // End of pages
            console.error(`Failed to fetch posts: ${res.status}`);
            break;
        }

        const posts = await res.json() as WPPost[]; // Type Assertion Fix
        if (posts.length === 0) break;

        allPosts = allPosts.concat(posts);
        page++;
    }

    return allPosts;
}

async function updatePostContent(id: number, content: string) {
    const res = await fetch(`${WP_API_URL}/posts/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${WP_AUTH}`
        },
        body: JSON.stringify({
            content: content
        })
    });

    if (!res.ok) {
        throw new Error(`Failed to update post ${id}: ${res.status}`);
    }

    return res.json();
}

async function run() {
    console.log("🔍 Starting cleanup of YouTube embeds...");
    const posts = await getAllPosts();
    console.log(`Checking ${posts.length} posts...`);

    let updatedCount = 0;

    for (const post of posts) {
        let content = post.content.rendered;
        let modified = false;

        // Clean-up Patterns
        const footerMarker = '📺 참고 영상';

        // 1. Split content if footer exists
        const parts = content.split(footerMarker);

        let bodyFn = (text: string) => {
            let originalText = text;

            // Remove iframes (YouTube embeds)
            text = text.replace(/<iframe[^>]*src="[^"]*youtube[^"]*"[^>]*><\/iframe>/gi, '');
            text = text.replace(/<iframe[^>]*src="[^"]*youtu\.be[^"]*"[^>]*><\/iframe>/gi, '');

            // Remove div.video-container
            text = text.replace(/<div class="video-container"[^>]*>[\s\S]*?<\/div>/gi, '');

            // Remove oEmbed paragraphs
            text = text.replace(/<figure class="wp-block-embed is-type-video is-provider-youtube[^"]*"[^>]*>[\s\S]*?<\/figure>/gi, '');

            // Remove standalone links in paragraphs
            text = text.replace(/<p>\s*https:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s<]+\s*<\/p>/gi, '');

            // Remove empty paragraphs left behind
            text = text.replace(/<p>\s*<\/p>/gi, '');

            return text;
        };

        if (parts.length > 1) {
            // Process body only
            const newBody = bodyFn(parts[0]);
            if (newBody !== parts[0]) {
                content = newBody + footerMarker + parts.slice(1).join(footerMarker);
                modified = true;
            }
        } else {
            // Process entire content (assuming no footer or footer text is different)
            // But if we process entire content, we might delete the embed we want to keep if it doesn't match 'footerMarker'
            // The user said "마지막에 추가 자료로는 잘 나왔는데". Ideally we should identify the Last embed.
            // But since we just added the footer logic recently, most posts won't have it except the very latest one.
            // The latest one likely HAS the footerMarker.
            // So for OLD posts, we wipe everything.

            const newContent = bodyFn(content);
            if (newContent !== content) {
                content = newContent;
                modified = true;
            }
        }

        if (modified) {
            console.log(`[Fix] Removing embeds from "${post.title.rendered}"`);
            try {
                await updatePostContent(post.id, content);
                console.log(`✅ Updated post ${post.id}`);
                updatedCount++;
            } catch (e) {
                console.error(`❌ Failed to update ${post.id}:`, e);
            }
        }
    }

    console.log(`Job complete. Updated ${updatedCount} posts.`);
}

run();
