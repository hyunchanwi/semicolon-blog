import { fetch as undiciFetch, Agent } from "undici";
const _http1Agent = new Agent({ allowH2: false });
const wpFetch = (url: string, opts: any = {}) => undiciFetch(url, { ...opts, dispatcher: _http1Agent }) as any;

const WP_API_URL = process.env.WP_API_URL || "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

async function run() {
    const res = await wpFetch(`${WP_API_URL}/posts?per_page=1`, {
        headers: { 'Authorization': `Basic ${WP_AUTH}` }
    });
    console.log("Total Posts:", res.headers.get('x-wp-total'));
    console.log("Total Pages:", res.headers.get('x-wp-totalpages'));
}
run();
