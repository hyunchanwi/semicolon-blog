import { fetch } from 'undici';

async function checkIndex() {
    try {
        const url = 'https://html.duckduckgo.com/html/?q=site:semicolonittech.com';
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        const html = await res.text();
        const resultsCount = (html.match(/class="result__snippet/g) || []).length;
        console.log(`DuckDuckGo found approx ${resultsCount} results on the first page.`);
    } catch (e) {
        console.error("Scraping error:", e);
    }
}
checkIndex();
