import { GoogleGenerativeAI } from "@google/generative-ai";
import { SearchResult } from "./search/interface";
import { ensureHtml } from "@/lib/markdown-to-html";

export interface BlogPostResult {
    title: string;
    content: string;
    // SEO fields for Rank Math
    seoTitle: string;        // 50-60자
    metaDescription: string; // 150-160자
    focusKeyphrase: string;  // 핵심 검색어
}

export async function generateBlogPost(topic: string, searchResults: SearchResult[]): Promise<BlogPostResult> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const context = searchResults.map((r, i) =>
        `Source ${i + 1} (${r.title}):\n${r.content}\nURL: ${r.url}`
    ).join("\n\n");

    const prompt = `
    Role: You are a professional tech blogger and SEO specialist for "Semicolon;" (a Korean tech blog).
    Current Year: **2026**
    Task: Write a high-quality, SEO-optimized blog post about "${topic}" based on the provided sources.
    
    Requirements:
    1. Language: KOREAN (한국어) - 모든 내용을 한국어로 작성
    2. Length: **공백 제외 2500자 내외**. 내용을 아주 상세하고 전문적으로 작성할 것. (Reduced from 3500 for optimization)
    3. Recency: 반드시 **2026년**의 최신 트렌드를 반영하세요. 제목이나 본문에 과거 연도(2023, 2024 등)가 포함되지 않도록 주의하고, 필요한 경우 "2026년 최신 소식", "2026년 업데이트" 등의 표현을 사용하세요.
    4. Title: 첫 줄에 한국어 제목을 <h2> 태그로 작성 (매력적이고 SEO 친화적으로)
    5. Tone: Professional yet accessible (Apple Korea style), engaging, insightful. NO Markdown formatting (###, **). Use HTML only.
    6. Structure:
       - Introduction: Hook the reader, explain why this matters. 첫 100단어 내에 핵심 키워드 포함.
       - Body: Analyze the facts from sources. Use <h3> for subtitles (2-4개).
       - Conclusion: Summary and future outlook.
    7. Content Enhancement:
       - **Images/Videos**: If the sources contain image or video URLs, embed them using HTML <img> or <iframe/video> tags where relevant. 모든 이미지에 한국어 alt 텍스트 필수.
       - **Sources Section**: At the very end of the post, add a horizontal rule (<hr />) followed by a "참고 자료" section listing the source titles and URLs.
    8. Formatting: Return ONLY the HTML content (starting with <article>). 
       - Start with <article> and include <h2> for the Korean title at the very beginning
       - Use <h3>, <p>, <ul>, <li>, <strong>, <blockquote>.
       - Do NOT use <h1> or <html> tags.
       - Embed the source URLs naturally as links (e.g., <a href="...">source</a>) where appropriate.
       - **ABSOLUTELY NO MARKDOWN**: Do not use ### or **. Always use HTML tags.
    
    9. **SEO METADATA (VERY IMPORTANT)**: 
       글 본문 콘텐츠 작성 후, 반드시 마지막에 다음 형식으로 SEO 메타데이터를 추가하세요:
       
       <!--SEO_META_START-->
       SEO_TITLE: [50-60자의 SEO 최적화 제목, 핵심 키워드 포함, 클릭 유도]
       META_DESC: [150-160자의 메타 설명, 핵심 내용 요약, 검색 결과에 표시될 텍스트]
       FOCUS_KW: [가장 중요한 검색 키워드 1개, 예: "아이폰16 출시일" 또는 "ChatGPT 사용법"]
       <!--SEO_META_END-->
    
    Sources to use:
    ${context}
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Simple cleanup if MD code blocks are returned
        text = text.replace(/```html/g, "").replace(/```/g, "").trim();

        // Markdown to HTML fallback
        text = ensureHtml(text);

        // HTML 엔티티 디코딩 함수
        const decodeHtmlEntities = (str: string): string => {
            return str
                .replace(/&#8216;/g, "'")
                .replace(/&#8217;/g, "'")
                .replace(/&#8220;/g, '"')
                .replace(/&#8221;/g, '"')
                .replace(/&#8211;/g, "–")
                .replace(/&#8212;/g, "—")
                .replace(/&#038;/g, "&")
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'");
        };

        // 콘텐츠 디코딩 적용
        text = decodeHtmlEntities(text);

        // Extract Korean title from <h2> tag
        const titleMatch = text.match(/<h2[^>]*>([^<]+)<\/h2>/);
        const koreanTitle = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : topic;

        // Extract SEO metadata
        const seoMetaMatch = text.match(/<!--SEO_META_START-->([\s\S]*?)<!--SEO_META_END-->/);
        let seoTitle = koreanTitle;
        let metaDescription = "";
        let focusKeyphrase = topic;

        if (seoMetaMatch) {
            const seoBlock = seoMetaMatch[1];

            const seoTitleMatch = seoBlock.match(/SEO_TITLE:\s*(.+)/);
            if (seoTitleMatch) seoTitle = seoTitleMatch[1].trim();

            const metaDescMatch = seoBlock.match(/META_DESC:\s*(.+)/);
            if (metaDescMatch) metaDescription = metaDescMatch[1].trim();

            const focusKwMatch = seoBlock.match(/FOCUS_KW:\s*(.+)/);
            if (focusKwMatch) focusKeyphrase = focusKwMatch[1].trim();

            // Remove SEO meta block from content
            text = text.replace(/<!--SEO_META_START-->[\s\S]*?<!--SEO_META_END-->/, "").trim();
        }

        // Fallback: Generate meta description from content if not provided
        if (!metaDescription) {
            const plainText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            metaDescription = plainText.slice(0, 155) + "...";
        }

        console.log(`[Gemini] SEO Generated - Title: ${seoTitle.slice(0, 30)}..., Keyphrase: ${focusKeyphrase}`);

        return {
            title: koreanTitle,
            content: text,
            seoTitle,
            metaDescription,
            focusKeyphrase,
        };
    } catch (error) {
        console.error("Gemini Generation Error:", error);
        throw new Error(`Gemini Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

// 상품 소개 멘트 및 제목 생성 (PICKS용)
export async function generateProductContent(productName: string, price: number, description: string): Promise<{ title: string; content: string }> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
    당신은 IT 기기 및 가젯 전문 리뷰어입니다.
    다음 제품에 대해 사용자가 구매하고 싶어지도록 매력적인 "3줄 요약 추천 멘트"와 "클릭을 유도하는 제목"을 작성해주세요.
    
    제품명: ${productName}
    가격: ${price}원
    기본 설명: ${description}

    [조건]
    1. 제목: 이모지 1개 포함, 30자 이내, 핵심 특징 강조. (예: 🚀 가성비 끝판왕! 갤럭시 S24 울트라)
    2. 내용: 3개의 bullet point로 작성. 각 포인트는 50자 이내. 전문적인 용어와 친근한 말투 사용.
    3. 결과는 오직 JSON 형식으로만 반환하세요. 마크다운이나 다른 설명 없이.

    Format:
    {
        "title": "생성된 제목",
        "content": "- 추천 이유 1\n- 추천 이유 2\n- 추천 이유 3"
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        let text = response.text();

        // JSON 파싱 전처리 (Markdown code block 제거)
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Product Content Generation Error:", error);
        // 실패 시 기본값 반환
        return {
            title: `[추천] ${productName}`,
            content: `- 가성비 좋은 제품\n- 뛰어난 성능\n- 사용자 만족도 높음`
        };
    }
}
