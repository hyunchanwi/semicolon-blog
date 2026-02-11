import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function checkIdentity() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

    try {
        const prompt = "Who are you? (Mention your model name if you know it)";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        console.log(`🤖 Response: ${response.text().trim()}`);
    } catch (error: any) {
        console.error("❌ Error:", error.message);
    }
}

checkIdentity();
