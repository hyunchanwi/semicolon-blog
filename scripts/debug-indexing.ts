/**
 * debug-indexing.ts
 * Google Indexing API 직접 호출 테스트
 * 실행: npx tsx scripts/debug-indexing.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { googlePublishUrl } from '../src/lib/google-indexing';

async function main() {
    console.log("🔍 Debugging Google Indexing API...");

    // Test with a dummy URL that belongs to the domain
    const testUrl = "https://semicolonittech.com/blog/debug-indexing-test";

    console.log(`Attempting to publish: ${testUrl}`);

    try {
        const result = await googlePublishUrl(testUrl);

        if (result) {
            console.log("✅ Success! API returned:", result);
        } else {
            console.log("❌ Failed. googlePublishUrl returned null.");
            console.log("Check console errors above for details.");

            // Debug env vars
            console.log("\n[Environment Check]");
            console.log("GOOGLE_INDEXING_CLIENT_EMAIL:", process.env.GOOGLE_INDEXING_CLIENT_EMAIL ? "Set" : "Missing");
            console.log("GOOGLE_INDEXING_PRIVATE_KEY:", process.env.GOOGLE_INDEXING_PRIVATE_KEY ? "Set (Length: " + process.env.GOOGLE_INDEXING_PRIVATE_KEY.length + ")" : "Missing");
            console.log("NODE_ENV:", process.env.NODE_ENV);
        }
    } catch (e) {
        console.error("❌ Exception:", e);
    }
}

main();
