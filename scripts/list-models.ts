import * as dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function main() {
    const keysString = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
    const key = keysString.split(',')[0].trim();
    if (!key) throw new Error("No API key");

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await res.json();

    // Print all available model names
    data.models?.forEach((m: any) => console.log(m.name, m.supportedGenerationMethods));
}

main().catch(console.error);
