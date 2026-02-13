
import { config } from "dotenv";
config({ path: ".env.local" });

import { googlePublishUrl } from "../src/lib/google-indexing";

async function main() {
    const testUrl = "https://semicolonittech.com/blog/test-indexing-check";
    console.log(`[Test] Sending indexing request for: ${testUrl}`);

    try {
        const result = await googlePublishUrl(testUrl);
        if (result) {
            console.log("✅ Indexing Request Success!");
            console.log(JSON.stringify(result, null, 2));
        } else {
            console.log("❌ Indexing Request Failed (result is null)");
        }
    } catch (e) {
        console.error("❌ Indexing Request Error:", e);
    }
}

main();
