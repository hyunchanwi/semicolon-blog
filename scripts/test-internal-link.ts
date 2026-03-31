import { getRecentPostUrls } from "../src/lib/wp-server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function main() {
    console.log("Fetching recent posts...");
    const recentPosts = await getRecentPostUrls(5);
    console.log("Recent posts:", recentPosts);

    const recentPostsContext = "\n\n## [블로그 기존 글 목록 (내부 링크용)]\n" +
        "아래는 우리 블로그에 이미 작성된 글 목록입니다. 본문을 작성하다가 맥락이 자연스럽게 이어질 때, 이 글들을 적극적으로 언급하며 HTML <a> 태그로 링크를 걸어주세요.\n" +
        recentPosts.map(p => `- 제목: ${p.title} (URL: ${p.url})`).join("\n");

    const prompt = `
당신은 IT 칼럼니스트입니다. 연도는 2026년입니다.
아래 주어진 기존 글 목록을 자연스럽게 참고하여(링크 포함), "애플의 2026년 폴더블 시장 진출 전망"에 대해서 3문단짜리 짧은 글을 작성해주세요.
반드시 HTML 형태(p, a 태그)로만 반환하세요.
${recentPostsContext}
    `;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    console.log("Calling Gemini...");
    const result = await model.generateContent(prompt);
    console.log("\n--- RESULT ---\n");
    console.log(result.response.text());
}

main().catch(console.error);
