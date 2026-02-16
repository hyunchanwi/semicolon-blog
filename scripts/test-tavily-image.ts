
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { TavilySearchProvider } from '../src/lib/search/tavily';

// Load .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const firstEqual = line.indexOf('=');
        if (firstEqual === -1) return;
        const key = line.substring(0, firstEqual).trim();
        let value = line.substring(firstEqual + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (key && value) process.env[key] = value;
    });
}

async function testTavilyImage() {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
        console.error("❌ TAVILY_API_KEY not set");
        return;
    }

    console.log(`🔑 Testing with API Key: ${apiKey.slice(0, 8)}...`);
    const searcher = new TavilySearchProvider(apiKey);
    const query = "Samsung Galaxy S24 Ultra titanium gray back view";

    try {
        console.log(`🔍 Searching for: "${query}"...`);
        const results = await searcher.search(`${query} image`);

        console.log(`✅ Found ${results.length} results`);

        const bestResult = results.find((r: any) => r.images && r.images.length > 0);

        if (bestResult) {
            console.log("🎉 Best Result with Image:", bestResult.title);
            console.log("🖼️ Image URL:", bestResult.images[0]);
        } else {
            console.log("⚠️ No result with images found.");
            // Log raw results to see structure
            // console.log(results);
        }

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

testTavilyImage();
