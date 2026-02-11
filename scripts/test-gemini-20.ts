import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function testGemini20() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return;

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = "gemini-2.0-flash"; // Choosing 2.0 Flash from the list
    const model = genAI.getGenerativeModel({ model: modelName });

    console.log(`🚀 테스팅 모델: ${modelName}...`);

    try {
        const prompt = "간단하게 '안녕하세요, 2.0 Flash 시스템이 정상 작동 중입니다'라고 한 문장으로 대답해줘.";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        console.log("✅ 성공!");
        console.log(`🤖 AI: ${response.text().trim()}`);
    } catch (error: any) {
        console.error("❌ 실패:", error.message);
    }
}

testGemini20();
