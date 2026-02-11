import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function testLite() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return;

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = "gemini-flash-lite-latest";
    const model = genAI.getGenerativeModel({ model: modelName });

    console.log(`🚀 테스팅 모델: ${modelName}...`);

    try {
        const prompt = "Hi, one sentence response please.";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        console.log("✅ 성공!");
        console.log(`🤖 AI: ${response.text().trim()}`);
    } catch (error: any) {
        console.error("❌ 실패:", error.message);
    }
}

testLite();
