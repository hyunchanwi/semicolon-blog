
import { google } from 'googleapis';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function checkIndexingStatus() {
    const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
        console.error("❌ Missing Google Indexing credentials in .env.local");
        return;
    }

    const authClient = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const indexing = google.indexing({ version: 'v3', auth: authClient });

    // 최근 글 URL 예시 (실제 존재하는 글이어야 함)
    // 여기서는 가장 최근 포스트를 API로 가져와서 그 URL을 테스트해봅니다.
    const WP_API_URL = process.env.WP_API_URL || "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";

    try {
        console.log("Fetching latest post to test...");
        const res = await fetch(`${WP_API_URL}/posts?per_page=1&_embed`);
        if (!res.ok) throw new Error("Failed to fetch posts");
        const posts = await res.json();

        if (posts.length === 0) {
            console.log("No posts found to test.");
            return;
        }

        const post = posts[0];
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semicolonittech.com";
        // wp-api.ts 등에서 사용하는 슬러그 추출 로직과 동일하게
        const postSlug = post.slug || post.link.split('/').filter((s: string) => s).pop();
        const testUrl = `${siteUrl}/blog/${postSlug}`;

        console.log(`Checking status for URL: ${testUrl}`);

        const statusRes = await indexing.urlNotifications.getMetadata({
            url: testUrl,
        });

        console.log("\n✅ Indexing API Status Response:");
        console.log(JSON.stringify(statusRes.data, null, 2));

        if (statusRes.data.latestUpdate) {
            console.log(`\nℹ️ Latest notification sent at: ${statusRes.data.latestUpdate.notifyTime}`);
            console.log(`ℹ️ Type: ${statusRes.data.latestUpdate.type}`);
        } else {
            console.log("\n⚠️ No notification history found for this URL via Indexing API.");
            console.log("This might mean the API call failed silently, or this specific URL hasn't been submitted yet.");
        }

    } catch (error: any) {
        console.error("\n❌ Error checking status:", error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
    }
}

checkIndexingStatus();
