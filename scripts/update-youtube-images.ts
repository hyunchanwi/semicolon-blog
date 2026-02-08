import 'dotenv/config';
import { TavilySearchProvider } from '../src/lib/search/tavily';
import { uploadImageFromUrl, getOrCreateTag } from '../src/lib/wp-server';

// Environment variables check
const WP_API_URL = process.env.WP_API_URL;
const WP_AUTH = process.env.WP_AUTH;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

if (!WP_API_URL || !WP_AUTH || !TAVILY_API_KEY) {
    console.error('❌ Missing environment variables (WP_API_URL, WP_AUTH, TAVILY_API_KEY)');
    process.exit(1);
}

// Helper to fetch posts with YouTube tag
async function getYouTubePosts() {
    console.log('🔍 Finding YouTube posts...');

    // 1. Get YouTube Tag ID
    // Note: This relies on the tag existing. If not, we might need to search by other means or assume tag 'YouTube'
    const tagId = await getOrCreateTag('YouTube', WP_AUTH!);
    if (!tagId) {
        console.error('❌ Could not find "YouTube" tag');
        return [];
    }

    // 2. Fetch posts
    const res = await fetch(`${WP_API_URL}/posts?tags=${tagId}&per_page=20&_fields=id,title,content,featured_media`, {
        headers: {
            'Authorization': `Basic ${WP_AUTH}`
        }
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch posts: ${await res.text()}`);
    }

    return await res.json();
}

async function updatePostImage(post: any) {
    const title = post.title.rendered;
    console.log(`\n🖼️ Processing: "${title}" (ID: ${post.id})`);

    // 1. Search Image via Tavily
    const searcher = new TavilySearchProvider(TAVILY_API_KEY!);
    let newImageUrl = "";

    try {
        const results = await searcher.search(`${title} image`);
        const bestResult = results.find((r: any) => r.images && r.images.length > 0);
        if (bestResult && bestResult.images && bestResult.images.length > 0) {
            newImageUrl = bestResult.images[0];
            console.log(`   ✅ Found image: ${newImageUrl}`);
        }
    } catch (e) {
        console.error('   ❌ Tavily search failed:', e);
        return;
    }

    if (!newImageUrl) {
        console.log('   ⚠️ No image found via Tavily. Skipping.');
        return;
    }

    // 2. Upload to WordPress
    let mediaId: number | null = 0;
    try {
        mediaId = await uploadImageFromUrl(newImageUrl, title, WP_AUTH!);
        if (!mediaId) {
            console.error('   ❌ Image upload returned null (probably failed)');
            return;
        }
        console.log(`   ✅ Uploaded media ID: ${mediaId}`);
    } catch (e) {
        console.error('   ❌ Image upload failed:', e);
        return;
    }

    // 3. Update Post
    // - Remove first <figure> or <img> from content (old thumbnail)
    // - Remove <div class="video-container"> if present? NO, keep video.
    // - Set featured_media

    let content = post.content.rendered;

    // Remove existing top image logic (simple regex for standard WP block image or raw img)
    // Strategy: Remove the first <figure> block if it looks like a thumbnail wrapper, 
    // OR if we inserted it manually before, it might be just an <img> tag.
    // Based on previous code: 
    // featuredImageHtml = `<figure class="wp-block-image size-large"><img src="..." .../></figure>`

    const figureRegex = /<figure class="wp-block-image size-large">[\s\S]*?<\/figure>/;
    if (figureRegex.test(content)) {
        content = content.replace(figureRegex, '');
        console.log('   ✂️ Removed existing featured image from content');
    }

    // Update Request
    const updateRes = await fetch(`${WP_API_URL}/posts/${post.id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${WP_AUTH}`
        },
        body: JSON.stringify({
            featured_media: mediaId,
            content: content
        })
    });

    if (updateRes.ok) {
        console.log(`   ✨ Successfully updated post ${post.id}`);
    } else {
        console.error(`   ❌ Failed to update post: ${await updateRes.text()}`);
    }
}

async function main() {
    try {
        const posts = await getYouTubePosts();
        console.log(`Found ${posts.length} posts to check.`);

        for (const post of posts) {
            await updatePostImage(post);
        }
    } catch (e) {
        console.error('Script failed:', e);
    }
}

main();
