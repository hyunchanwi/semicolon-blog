/**
 * check-indexing-status.ts
 * 최근 글들의 자동 색인 요청 여부 (indexing_requested_at 메타 데이터) 확인
 */

import { Agent, fetch as undiciFetch } from "undici";

const http1Agent = new Agent({ allowH2: false });
const wpFetch = (url: string, opts: any = {}) =>
    undiciFetch(url, { ...opts, dispatcher: http1Agent }) as any;

const WP_API_URL = "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

async function main() {
    console.log("🔍 Checking indexing status of recent posts...\n");

    try {
        const res = await wpFetch(`${WP_API_URL}/posts?per_page=10&_fields=id,title,date,link,meta,status`, {
            headers: { Authorization: `Basic ${WP_AUTH}` },
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch posts: ${res.status}`);
        }

        const posts = await res.json();

        console.log(`| ID | Title (Truncated) | Date | Source | Indexing Requested At |`);
        console.log(`|---|---|---|---|---|`);

        posts.forEach((p: any) => {
            const title = p.title?.rendered || "(No Title)";
            const date = p.date?.split("T")[0];
            const meta = p.meta || {};
            const source = meta.automation_source_id || "Manual";
            const indexedAt = meta.indexing_requested_at
                ? new Date(meta.indexing_requested_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
                : "❌ Not Requested";

            console.log(`| ${p.id} | ${title.slice(0, 30)}... | ${date} | ${source} | ${indexedAt} |`);
        });

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

main();
