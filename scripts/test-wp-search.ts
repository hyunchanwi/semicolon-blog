import { fetch as undiciFetch, Agent } from "undici";
const _http1Agent = new Agent({ allowH2: false });
const wpFetch = (url: string, opts: any = {}) => undiciFetch(url, { ...opts, dispatcher: _http1Agent }) as any;

const WP_API_URL = process.env.WP_API_URL || "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

async function run() {
    console.log("Searching for bVtvFDACO58...");
    const res = await wpFetch(`${WP_API_URL}/posts?search=${encodeURIComponent('bVtvFDACO58')}`, {
        headers: { 'Authorization': `Basic ${WP_AUTH}` }
    });
    const posts = await res.json();
    console.log(`Found ${posts.length} posts.`);
    posts.forEach((p: any) => {
        console.log(`- ID: ${p.id}, Date: ${p.date}`);
        console.log(`  Title: ${p.title.rendered}`);
        console.log(`  Source ID: ${p.meta.youtube_source_id}`);
    });
}
run();
