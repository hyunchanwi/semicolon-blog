import { tavily } from "@tavily/core";
import * as fs from "fs";
import * as dotenv from "dotenv";

const envContent = fs.readFileSync(".env.prod", "utf-8");
const envConfig = dotenv.parse(envContent);

const apiKeys = (envConfig.TAVILY_API_KEYS || "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,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").split(",");
const client = tavily({ apiKey: apiKeys[1].trim() });

async function check() {
    try {
        const response = await client.search("site:semicolonittech.com", {
            search_depth: "advanced",
            max_results: 100
        });
        console.log("Indexed found:", response.results.length);
        response.results.slice(0, 5).forEach(r => console.log(r.url));
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}
check();
