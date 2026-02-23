import { tavily } from "@tavily/core";
import "dotenv/config"; // Ensure .env is loaded

async function testTavily() {
    const apiKey = process.env.TAVILY_API_KEY;
    console.log("Starting Tavily test...");
    
    if (!apiKey) {
        console.error("TAVILY_API_KEY is not set in environment.");
        return;
    }
    
    const client = tavily({ apiKey });

    try {
        const response = await client.search("Next.js 14 tutorial", {
            search_depth: "basic",
            max_results: 1
        });
        console.log("Success! Results:", response.results.length);
    } catch (error) {
        console.error("Tavily Search Error Details:", error);
    }
}

testTavily();
