
import { googlePublishUrl } from "../src/lib/google-indexing";
import { config } from "dotenv";
config({ path: ".env.local" });

async function testIndexing() {
    console.log("🚀 Starting Indexing API Test...");

    // Test with the homepage first (most likely to be indexed)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semicolonittech.com";
    console.log(`Target URL: ${siteUrl}`);

    try {
        console.log("Sending indexing request...");
        const result = await googlePublishUrl(siteUrl);

        if (result) {
            console.log("✅ Indexing Request Successful!");
            console.log("Response:", JSON.stringify(result, null, 2));
        } else {
            console.log("❌ Indexing Request Failed (No response)");
        }

    } catch (e) {
        console.error("❌ Unexpected Error:", e);
    }
}

testIndexing();
