import * as dotenv from "dotenv";
dotenv.config({ path: '.env.local' });
import { fetch as undiciFetch, Agent } from "undici";

const _http1Agent = new Agent({ allowH2: false });
const wpFetch = (url: string, opts: any = {}) => undiciFetch(url, { ...opts, dispatcher: _http1Agent }) as any;

async function main() {
    const WP_API_URL = process.env.WP_API_URL || "https://wp.semicolonittech.com/wp-json/wp/v2";
    const WP_AUTH = process.env.WP_AUTH || "";

    const res = await wpFetch(`${WP_API_URL}/posts?search=${encodeURIComponent("앗조아틀")}`, {
        headers: { "Authorization": `Basic ${WP_AUTH}` }
    });

    if (!res.ok) {
        console.error("Failed to fetch posts", res.status);
        return;
    }

    const posts = await res.json();
    if (posts.length === 0) {
        console.log("Post not found");
        return;
    }

    const post = posts[0];
    console.log("Title:", post.title.rendered);

    // Find youtube embed
    const content = post.content.rendered;
    const match = content.match(/youtube\.com\/embed\/([^"?]+)/);
    if (match) {
        const videoId = match[1];
        console.log("Found Video ID:", videoId);
        console.log("YouTube Link: https://www.youtube.com/watch?v=" + videoId);

        // Let's ask YouTube who uploaded it
        const ytKey = process.env.YOUTUBE_API_KEY;
        if (ytKey) {
            const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${ytKey}`);
            const ytData = await ytRes.json();
            if (ytData.items && ytData.items.length > 0) {
                console.log("Channel:", ytData.items[0].snippet.channelTitle);
            } else {
                console.log("Video not found on YT API");
            }
        }
    } else {
        console.log("No Youtube embed found");
    }
}

main().catch(console.error);
