import * as dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function wpFetch(url: string, options: any = {}): Promise<any> {
    return fetch(url, options);
}

const WP_API_URL = process.env.WP_API_URL || "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

async function main() {
    const url = `${WP_API_URL}/posts?per_page=10&status=publish,draft,private`;
    const res = await wpFetch(url, { headers: { 'Authorization': `Basic ${WP_AUTH}` } });
    if (!res.ok) {
        console.error("Failed", res.status);
        return;
    }

    const posts = await res.json();
    for (const post of posts) {
        const isYoutube = post.meta?.youtube_source_id != null || post.content?.rendered?.includes("youtube");
        console.log(`ID: ${post.id}, Title: "${post.title.rendered}", IsYT: ${isYoutube}, FeaturedMedia: ${post.featured_media}`);
    }
}

main().catch(console.error);
