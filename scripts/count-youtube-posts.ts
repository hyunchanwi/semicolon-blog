import * as dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function wpFetch(url: string, options: any = {}): Promise<any> {
    return fetch(url, options);
}

const WP_API_URL = process.env.WP_API_URL || "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

async function main() {
    let page = 1;
    let totalPosts = 0;
    let youtubePosts = 0;
    let hiddenLinkCount = 0;
    let missingLinkCount = 0;
    let missingLinkPostIds = [];

    while (true) {
        const url = `${WP_API_URL}/posts?per_page=100&page=${page}&status=publish,draft,private`;
        const res = await wpFetch(url, {
            headers: { 'Authorization': `Basic ${WP_AUTH}` }
        });

        if (!res.ok) {
            break;
        }

        const posts = await res.json();
        if (!posts || posts.length === 0) break;

        for (const post of posts) {
            totalPosts++;
            const content = post.content?.rendered || "";
            if (content.includes("youtube.com/embed") || content.includes("youtube.com/watch")) {
                youtubePosts++;

                if (content.includes('original-video-link') || content.includes('<!-- Hidden original link')) {
                    hiddenLinkCount++;
                } else {
                    missingLinkCount++;
                    missingLinkPostIds.push(post.id);
                }
            }
        }
        page++;
    }

    console.log(`Total Posts Scanned: ${totalPosts}`);
    console.log(`Posts with YouTube embeds/links: ${youtubePosts}`);
    console.log(`Has hidden link (updated or original): ${hiddenLinkCount}`);
    console.log(`Missing hidden link (!): ${missingLinkCount}`);
    console.log(`First 10 missing IDs: ${missingLinkPostIds.slice(0, 10).join(', ')}`);
}

main().catch(console.error);
