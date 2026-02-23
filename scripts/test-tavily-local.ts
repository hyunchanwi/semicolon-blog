import { tavily } from "@tavily/core";
import * as fs from "fs";

async function testIt() {
    const envContent = fs.readFileSync(".env.local", "utf-8");
    const match = envContent.match(/TAVILY_API_KEY=(.*)/);
    const apiKey = match ? match[1].trim() : null;
    
    if (!apiKey) {
        console.log("No TAVILY_API_KEY found in .env.local");
        return;
    }
    
    const client = tavily({ apiKey });

    try {
        const res = await client.search("Next.js", { search_depth: "basic", max_results: 1 });
        console.log("Tavily local key success! Results:", res.results.length);
    } catch (err: any) {
        console.log("Tavily local key error:", err.message);
    }
}
testIt();
