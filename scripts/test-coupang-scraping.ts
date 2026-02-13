
import { config } from "dotenv";
config({ path: ".env.local" });

// We need to fetch from the actual route or mimic the fetch logic exactly.
// Since we can't hit the route easily, let's copy the fetch logic to verify if headers work.

import * as cheerio from "cheerio";

async function testScraping() {
    // A real Coupang product link (Galaxy S24 Ultra)
    // Note: Short links like https://link.coupang.com/... might redirect.
    // Let's test with a real link if possible, or a known product URL.
    // If we don't have a real link, we can try to search for one or just use a placeholder that redirects.
    // Let's try a standard product URL format.
    const url = "https://www.coupang.com/vp/products/7846076135"; // Example ID, might be invalid but check response code.

    console.log(`Testing scraping for: ${url}`);

    const headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": "https://www.coupang.com/",
        "Sec-Ch-Ua": '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"macOS"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "max-age=0",
    };

    try {
        const res = await fetch(url, { headers, redirect: 'follow' });
        console.log(`Response Status: ${res.status}`);

        if (res.status === 403 || res.status === 429) {
            console.error("❌ Blocked (403/429)");
            return;
        }

        if (!res.ok) {
            console.error(`❌ Failed: ${res.status}`);
            return;
        }

        const html = await res.text();
        const $ = cheerio.load(html);

        const title = $('meta[property="og:title"]').attr('content') || $('title').text();
        console.log(`✅ Title Parsed: ${title}`);

    } catch (e) {
        console.error("Error:", e);
    }
}

testScraping();
