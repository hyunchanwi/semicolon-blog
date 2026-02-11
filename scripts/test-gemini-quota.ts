import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function testGeminiQuota() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY가 .env.local에 설정되어 있지 않습니다.");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = "gemini-flash-lite-latest";
    const model = genAI.getGenerativeModel({ model: modelName });

    console.log(`🚀 테스팅 모델: ${modelName}...`);

    try {
        const prompt = `다음 블로그 글의 핵심 내용을 한국어로 3개의 핵심 포인트로 요약해주세요.

규칙:
- 각 포인트는 한 문장으로 명확하게
- 이모지를 적절히 사용

글 내용:
인공지능(AI) 기술이 2026년 다양한 산업 분야에서 혁신을 가져오고 있습니다. 
특히 의료, 교육, 금융 분야에서 AI 활용이 크게 증가했습니다.
AI 기반 진단 시스템은 의사의 진단 정확도를 30% 이상 향상시켰으며,
맞춤형 교육 플랫폼은 학생들의 학습 효율을 크게 높이고 있습니다.

출력 형식:
• 첫 번째 핵심 포인트
• 두 번째 핵심 포인트
• 세 번째 핵심 포인트`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("✅ 요약 생성 성공!");
        console.log("---");
        console.log(text.trim());
        console.log("---");
        console.log("\n✨ 모델이 정상 작동합니다. 배포 후 AI 요약 기능이 복구됩니다.");

    } catch (error: any) {
        console.error("❌ 실패:", error.message);
    }
}

testGeminiQuota();
