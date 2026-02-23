// Test if WordPress strips HTML comments
import { fetch as undiciFetch, Agent } from "undici";
const _http1Agent = new Agent({ allowH2: false });
const wpFetch = (url: string, opts: any = {}) => undiciFetch(url, { ...opts, dispatcher: _http1Agent }) as any;

const WP_API_URL = "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

async function run() {
    const res = await wpFetch(`${WP_API_URL}/posts?per_page=1`, {
        headers: { 'Authorization': `Basic ${WP_AUTH}` }
    });
    const posts = await res.json();
    if (posts && posts.length > 0) {
        console.log("Post Title:", posts[0].title.rendered);
        console.log("Includes comment?:", posts[0].content.rendered.includes("automation_source_id"));
        console.log("End of content:", posts[0].content.rendered.slice(-100));
        
        console.log("Checking meta:");
        console.log(posts[0].meta);
    }
}
run();
