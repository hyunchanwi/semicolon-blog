import { tavily } from "@tavily/core";
import * as fs from "fs";
import * as dotenv from "dotenv";

async function testTavilyAllEnv() {
    console.log("=== Testing Tavily API Keys ===");
    const testKey = async (envFile: string) => {
        try {
            const content = fs.readFileSync(envFile, "utf-8");
            const envConfig = dotenv.parse(content);
            const apiKey = envConfig.TAVILY_API_KEY;

            if (!apiKey) {
                console.log(`[${envFile}] No TAVILY_API_KEY found.`);
                return;
            }

            console.log(`[${envFile}] Found key. Testing...`);
            const client = tavily({ apiKey });
            const res = await client.search("Next.js 14", { search_depth: "basic", max_results: 1 });
            console.log(`[${envFile}] SUCCESS! Found ${res.results.length} results.`);
        } catch (err: any) {
            console.log(`[${envFile}] ERROR: ${err.message}`);
        }
    };

    await testKey(".env.local");
    await testKey(".env.prod");
}

testTavilyAllEnv();
