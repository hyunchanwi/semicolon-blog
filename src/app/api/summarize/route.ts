import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPostById, updatePost } from "@/lib/wp-admin-api";

export async function POST(request: NextRequest) {
    try {
        const { content, postId } = await request.json();

        if (!content) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        // 1. DB에 이미 저장된 요약이 있는지 확인 (Cost Saving)
        if (postId) {
            try {
                const post = await getPostById(postId);
                if (post && post.meta && post.meta.ai_summary) {
                    console.log(`[Summarize] Returning saved summary for post ${postId}`);
                    return NextResponse.json({ summary: post.meta.ai_summary });
                }
            } catch (err) {
                console.warn(`[Summarize] Failed to check existing summary for ${postId}`, err);
            }
        }

        // 2. HTML 태그 제거하여 순수 텍스트 추출
        const textContent = content
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 5000); // 토큰 제한을 위해 5000자로 제한

        if (textContent.length < 100) {
            return NextResponse.json({
                error: "글이 너무 짧아 요약할 수 없습니다."
            }, { status: 400 });
        }

        // 3. AI 요약 생성
        console.log(`[Summarize] Generating new summary for post ${postId || 'unknown'}`);
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
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

        // 4. DB에 결과 저장 (Next Time Free)
        if (postId && summary) {
            try {
                await updatePost(postId, {
                    meta: { ai_summary: summary }
                });
                console.log(`[Summarize] Saved summary to post ${postId}`);
            } catch (err) {
                console.error(`[Summarize] Failed to save summary to post ${postId}`, err);
                // 저장 실패해도 사용자는 요약을 봐야 하므로 에러 무시
            }
        }

        return NextResponse.json({ summary });

    } catch (error: any) {
        console.error("Summarize Error:", error);
        return NextResponse.json(
            { error: error.message || "요약 생성 실패" },
            { status: 500 }
        );
    }
}
