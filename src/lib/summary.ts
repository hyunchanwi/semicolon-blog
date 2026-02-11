import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * 글 내용을 AI로 요약
 */
export async function generateSummary(content: string): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
        console.log('[Summary] No Gemini API key');
        return '';
    }

    // HTML 태그 제거
    const textContent = content
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 5000);

    if (textContent.length < 100) {
        return '';
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

        const prompt = `
다음 블로그 글의 핵심 내용을 한국어로 3-5개의 핵심 포인트로 요약해주세요.

규칙:
- 각 포인트는 한 문장으로 명확하게
- 이모지를 적절히 사용
- 전문 용어는 쉽게 풀어서 설명
- 독자가 글을 읽지 않아도 핵심을 파악할 수 있도록

글 내용:
${textContent}

출력 형식 (마크다운):
• 첫 번째 핵심 포인트
• 두 번째 핵심 포인트
• 세 번째 핵심 포인트
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text().trim();

        console.log('[Summary] Generated successfully');
        return summary;

    } catch (error) {
        console.error('[Summary] Error:', error);
        return '';
    }
}
