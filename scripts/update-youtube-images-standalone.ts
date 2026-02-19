import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.prod') });

// ----------------------------------------------------------------------------
// 1. Tavily Search Provider (Simplified)
// ----------------------------------------------------------------------------
interface SearchResult {
    title: string;
    url: string;
    content: string;
    publishedDate?: string;
    images?: string[];
}

class TavilySearchProvider {
    private apiKey: string;
    private baseUrl = "https://api.tavily.com/search";

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async search(query: string): Promise<SearchResult[]> {
        try {
            const response = await fetch(this.baseUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    api_key: this.apiKey,
                    query: query,
                    search_depth: "advanced",
                    include_answer: true,
                    include_images: true,
                    max_results: 5,
                    days: 1
                })
            });

            if (!response.ok) {
                throw new Error(`Tavily API error: ${response.status}`);
            }

            const data = await response.json();

            return data.results.map((result: any) => ({
                title: result.title,
                url: result.url,
                content: result.content,
                publishedDate: result.published_date,
                images: data.images ? data.images.map((img: any) => typeof img === 'string' ? img : img.url).filter(Boolean) : [],
            }));
        } catch (error) {
            console.error("Tavily Search Error:", error);
            throw new Error("Failed to fetch search results");
        }
    }
}

// ----------------------------------------------------------------------------
// 2. WP Helper Functions (Copied & Adapted)
// ----------------------------------------------------------------------------
const WP_API_URL = process.env.WP_API_URL || "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = process.env.WP_AUTH;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

if (!WP_AUTH || !TAVILY_API_KEY) {
    console.error('❌ Missing environment variables:');
    if (!WP_AUTH) console.error('   - WP_AUTH');
    if (!TAVILY_API_KEY) console.error('   - TAVILY_API_KEY');
    process.exit(1);
}

async function uploadImageFromUrl(imageUrl: string, title: string, wpAuth: string): Promise<number | null> {
    try {
        console.log(`[WP-Upload] Downloading: ${imageUrl}`);
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) {
            console.error(`[WP-Upload] Failed to download image: ${imgRes.status}`);
            return null;
        }

        const buffer = await imgRes.arrayBuffer();
        const blob = new Blob([buffer], { type: imgRes.headers.get("content-type") || "image/jpeg" });
        const filename = `${title.replace(/[^a-zA-Z0-9가-힣]/g, '-').slice(0, 30)}-${Date.now()}.jpg`;

        const formData = new FormData();
        formData.append('file', blob, filename);
        formData.append('title', title);
        formData.append('alt_text', title);

        console.log(`[WP-Upload] Uploading to WordPress as ${filename}...`);
        const uploadRes = await fetch(`${WP_API_URL}/media`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${wpAuth}`
            },
            body: formData
        });

        if (!uploadRes.ok) {
            console.error(`[WP-Upload] Upload failed: ${await uploadRes.text()}`);
            return null;
        }

        const data = await uploadRes.json();
        console.log(`[WP-Upload] Success! Media ID: ${data.id}`);
        return data.id;

    } catch (e) {
        console.error("[WP-Upload] Error:", e);
        return null;
    }
}

async function getOrCreateTag(tagName: string, wpAuth: string): Promise<number | null> {
    try {
        const searchRes = await fetch(`${WP_API_URL}/tags?search=${encodeURIComponent(tagName)}`, {
            headers: { 'Authorization': `Basic ${wpAuth}` }
        });

        if (searchRes.ok) {
            const tags = await searchRes.json();
            const existing = tags.find((t: any) => t.name.toLowerCase() === tagName.toLowerCase());
            if (existing) return existing.id;
        }

        // Return null if not found (we assume tag exists for this script)
        return null;
    } catch (e) {
        console.error("[WP-Tag] Error:", e);
        return null;
    }
}

// ----------------------------------------------------------------------------
// 3. Main Logic
// ----------------------------------------------------------------------------
async function main() {
    console.log('🔍 Starting image update process...');

    // 1. Get Tag ID
    const tagId = await getOrCreateTag('YouTube', WP_AUTH!);
    let postsToCheck: any[] = [];

    // 2. Fetch YouTube posts
    if (tagId) {
        console.log(`Getting YouTube posts (Tag ID: ${tagId})...`);
        const res = await fetch(`${WP_API_URL}/posts?tags=${tagId}&per_page=20&_fields=id,title,content,featured_media`, {
            headers: { 'Authorization': `Basic ${WP_AUTH}` }
        });
        if (res.ok) {
            const ytPosts = await res.json();
            postsToCheck = [...ytPosts];
        }
    }

    // 3. Fetch specific broken posts (Philadelphia, Nintendo)
    const keywords = ['필라델피아', '닌텐도', 'Nintendo', 'Philadelphia'];
    for (const keyword of keywords) {
        console.log(`Getting posts for keyword: "${keyword}"...`);
        const res = await fetch(`${WP_API_URL}/posts?search=${encodeURIComponent(keyword)}&per_page=5&_fields=id,title,content,featured_media`, {
            headers: { 'Authorization': `Basic ${WP_AUTH}` }
        });
        if (res.ok) {
            const kwPosts = await res.json();
            // Avoid duplicates
            for (const p of kwPosts) {
                if (!postsToCheck.some(existing => existing.id === p.id)) {
                    postsToCheck.push(p);
                }
            }
        }
    }

    console.log(`Found ${postsToCheck.length} unique posts to check.`);

    // 4. Process each post
    const searcher = new TavilySearchProvider(TAVILY_API_KEY!);

    for (const post of postsToCheck) {
        const title = post.title.rendered;
        console.log(`\n🖼️ Processing: "${title}" (ID: ${post.id})`);

        // Search Image
        let newImageUrl = "";
        let mediaId = 0;

        try {
            const results = await searcher.search(`${title} image`);
            // Find first result with images
            const bestResult = results.find((r: any) => r.images && r.images.length > 0);

            if (bestResult && bestResult.images && bestResult.images.length > 0) {
                newImageUrl = bestResult.images[0];
                console.log(`   ✅ Found image: ${newImageUrl}`);
            } else {
                console.log('   ⚠️ No image found via Tavily.');
            }
        } catch (e) {
            console.error('   ❌ Tavily search failed:', e);
        }

        // Upload
        if (newImageUrl) {
            const uploadedId = await uploadImageFromUrl(newImageUrl, title, WP_AUTH!);
            if (uploadedId) {
                mediaId = uploadedId;
            } else {
                console.error('   ❌ Image upload failed');
            }
        }

        // Update Post
        let content = post.content.rendered;

        // 1. Remove specific YouTube maxresdefault thumbnails
        const ytThumbRegex = /<img[^>]*src="[^"]*ytimg\.com[^"]*maxresdefault[^"]*"[^>]*>/gi;
        const ytThumbFigureRegex = /<figure[^>]*>[\s\S]*?ytimg\.com[^"]*maxresdefault[\s\S]*?<\/figure>/gi;

        if (ytThumbRegex.test(content) || ytThumbFigureRegex.test(content)) {
            content = content.replace(ytThumbFigureRegex, ''); // Remove wrapping figure first
            content = content.replace(ytThumbRegex, '');       // Remove standalone img
            console.log('   ✂️ Removed YouTube thumbnail from content');
        }

        // 2. Remove the first image block if it looks like a duplicate featured image (common in WP)
        // Only if it's at the very beginning of the content
        const firstFigureRegex = /^\s*<figure class="wp-block-image[^"]*">[\s\S]*?<\/figure>/i;
        if (firstFigureRegex.test(content)) {
            content = content.replace(firstFigureRegex, '');
            console.log('   ✂️ Removed top duplicate featured image from content');
        }

        // 3. Remove clean Unsplash images that might have been added as featured image duplicates
        // (If the new image URL is found in the content, remove it)
        if (newImageUrl) {
            // Escape special regex chars in URL
            const escapedUrl = newImageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const duplicateImgRegex = new RegExp(`<img[^>]*src="${escapedUrl}"[^>]*>`, 'gi');
            const duplicateFigureRegex = new RegExp(`<figure[^>]*>[\s\S]*?${escapedUrl}[\s\S]*?<\/figure>`, 'gi');

            if (duplicateImgRegex.test(content) || duplicateFigureRegex.test(content)) {
                content = content.replace(duplicateFigureRegex, '');
                content = content.replace(duplicateImgRegex, '');
                console.log('   ✂️ Removed duplicate new image from content block');
            }
        }

        // 4. Remove YouTube iframes and video containers (User Request)
        const iframeRegex = /<iframe[^>]*src="[^"]*youtube\.com\/embed[^"]*"[^>]*>.*?<\/iframe>/gi;
        const videoContainerRegex = /<div class="video-container"[^>]*>[\s\S]*?<\/div>/gi;

        let iframeRemoved = false;
        if (videoContainerRegex.test(content)) {
            content = content.replace(videoContainerRegex, '');
            iframeRemoved = true;
            console.log('   ✂️ Removed video-container with iframe');
        }
        if (iframeRegex.test(content)) { // Check specifically for standalone iframes too
            content = content.replace(iframeRegex, '');
            iframeRemoved = true;
            console.log('   ✂️ Removed standalone YouTube iframe');
        }

        // Update post if content changed OR if we have a new image to set
        // (Even if no new image found, we might have cleaned up content)
        if (content !== post.content.rendered || mediaId > 0) {
            const updatePayload: any = {
                content: content
            };
            if (mediaId > 0) {
                updatePayload.featured_media = mediaId;
            }

            const updateRes = await fetch(`${WP_API_URL}/posts/${post.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${WP_AUTH}`
                },
                body: JSON.stringify(updatePayload)
            });

            if (updateRes.ok) {
                console.log(`   ✨ Successfully updated post ${post.id}`);
            } else {
                console.error(`   ❌ Failed to update post ${post.id}:`, await updateRes.text());
            }
        } else {
            console.log(`   Example: No changes needed for post ${post.id}`);
        }
    }
}

main();
