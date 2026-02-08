
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.gemini') });

async function main() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API Key found");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // There is no direct listModels on genAI instance in some SDK versions?
    // Actually typically we need to use a modelManager or just try to get a model.
    // Wait, the error said "Call ListModels".
    // In node SDK: import { GoogleGenerativeAI } from "@google/generative-ai";
    // It seems the SDK might not expose listModels directly on the main class easily?
    // Let's check if we can simple fetch it via REST if SDK doesn't support it easily.

    console.log("Checking available models...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error(`Error: ${res.status} ${res.statusText}`);
            console.error(await res.text());
            return;
        }

        const data = await res.json();
        console.log("Available Models:");
        data.models?.forEach((m: any) => {
            console.log(`- ${m.name} (${m.supportedGenerationMethods?.join(', ')})`);
        });
    } catch (e) {
        console.error(e);
    }
}

main();
