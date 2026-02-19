
import { Agent, fetch } from 'undici';

const url = "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2/posts?per_page=1";
const agent = new Agent({ allowH2: false });

async function test() {
    console.log("Testing connection to:", url);
    try {
        const res = await fetch(url, {
            dispatcher: agent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        console.log("Status:", res.status);
        if (res.ok) {
            const data = await res.json();
            console.log("Data length:", Array.isArray(data) ? data.length : 'Not array');
            console.log("Success!");
        } else {
            console.log("Failed:", res.statusText);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
