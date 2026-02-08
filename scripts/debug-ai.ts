

import { TavilySearchProvider } from "../src/lib/search/tavily";
import { generateBlogPost } from "../src/lib/gemini";

// Hardcode keys for testing if environment variables fail
const TAVILY_KEY = process.env.TAVILY_API_KEY || "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";
const GEMINI_KEY = process.env.GEMINI_API_KEY || "AIzaSyAHCtDiJtNCMtXySV3V2pkD8_qsKvRVYhU";

// Overwrite process.env for the library modules
process.env.TAVILY_API_KEY = TAVILY_KEY;
process.env.GEMINI_API_KEY = GEMINI_KEY;

async function testAI() {
    console.log("--- AI Debug Start ---");
    console.log("Tavily Key:", TAVILY_KEY ? "Present" : "Missing");
    console.log("Gemini Key:", GEMINI_KEY ? "Present" : "Missing");

    try {
        // 1. Tavily Search
        console.log("\n1. Testing Tavily Search...");
        const searcher = new TavilySearchProvider(TAVILY_KEY);
        const results = await searcher.search("iPhone 16 rumors");

        console.log(`Found ${results.length} results.`);
        results.forEach((r, i) => console.log(`[${i}] ${r.title} (${r.url})`));

        if (results.length === 0) {
            console.error("❌ Tavily returned 0 results.");
            return;
        }

        // 2. Gemini Generation
        console.log("\n2. Testing Gemini Generation...");
        const result = await generateBlogPost("iPhone 16 rumors", results);

        console.log("\n--- Generated Content Preview ---");
        console.log("Title:", result.title);
        console.log("Content:", result.content.substring(0, 200) + "...");
        console.log("\n✅ AI Pipeline Working!");

    } catch (error: any) {
        console.error("\n❌ Error:", error.message);
        if (error.cause) console.error("Cause:", error.cause);
        if (error.response) console.error("Response:", await error.response.text());
    }
}

testAI();
