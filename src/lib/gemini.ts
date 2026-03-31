import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { SearchResult } from "./search/interface";
import { ensureHtml } from "@/lib/markdown-to-html";

/**
 * Gemini API 헬퍼 (다중 API Key Fallback 및 503 재시도 기능 포함)
 * 한 API 키의 한도(Quota)가 초과(429)되면 다음 키로 자동 전환됩니다.
 * 503 과부하 발생 시 지수 백오프(Exponential Backoff)로 최대 3회 재시도합니다.
 */
export async function generateContentWithRetry(
    prompt: string,
    modelName: string = "gemini-2.5-flash",
    maxRetries: number = 3,
    useGrounding: boolean = false
): Promise<any> {
    const keysString = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
    const apiKeys = keysString.split(',').map(k => k.trim()).filter(Boolean);

    if (apiKeys.length === 0) {
        throw new Error("[Gemini] No API Keys provided in environment variables.");
    }

    let lastError: Error | null = null;

    for (let keyIdx = 0; keyIdx < apiKeys.length; keyIdx++) {
        const apiKey = apiKeys[keyIdx];
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelConfig: any = { model: modelName };
        if (useGrounding) {
            modelConfig.tools = [{ googleSearch: {} }];
        }
        const model = genAI.getGenerativeModel(modelConfig);

        if (keyIdx > 0) {
            console.log(`[Gemini] 🔄 Automatic Fallback to API Key Setup (Index: ${keyIdx})`);
        }

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await model.generateContent(prompt);
                return result;
            } catch (error: any) {
                lastError = error;
                const errMsg = error?.message || String(error);

                const isTransientError =
                    error?.status === 503 ||
                    errMsg.includes("503") ||
                    errMsg.includes("Service Unavailable") ||
                    errMsg.includes("high demand") ||
                    errMsg.includes("fetch failed");

                const isQuotaError =
                    error?.status === 429 ||
                    errMsg.includes("429") ||
                    errMsg.includes("quota") ||
                    errMsg.includes("limit") ||
                    errMsg.includes("API key not valid") ||
                    errMsg.includes("exhausted");

                if (isQuotaError) {
                    console.warn(`[Gemini] ⚠️ Quota/Auth error for key index ${keyIdx}: ${errMsg}`);
                    break; // Break internal loop directly to fail over to NEXT API KEY!
                }

                if (!isTransientError || attempt === maxRetries) {
                    break; // Give up on this key if it's not a generic retryable error
                }

                const waitMs = 5000 * Math.pow(3, attempt - 1); // 5s, 15s, 45s
                console.warn(`[Gemini] ⚠️ Attempt ${attempt} transient error (Key ${keyIdx}). Retrying in ${waitMs / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, waitMs));
            }
        }
    }

    console.error("[Gemini] ❌ All available Gemini keys failed.");
    throw lastError;
}

export interface BlogPostResult {
    title: string;
    content: string;
    slug: string;            // English URL slug
    // SEO fields for Rank Math
    seoTitle: string;        // 50-60자
    metaDescription: string; // 150-160자
    focusKeyphrase: string;  // 핵심 검색어
}

export async function generateBlogPost(topic: string, searchResults: SearchResult[]): Promise<BlogPostResult> {

    const context = searchResults.map((r, i) =>
        `Source ${i + 1} (${r.title}):\n${r.content}\nURL: ${r.url}`
    ).join("\n\n");

    const prompt = `
    Role: You are a professional tech blogger and SEO specialist for "Semicolon;" (a Korean tech blog).
    Current Year: **2026**
    Task: Write a high-quality, SEO-optimized blog post about "${topic}" based on the provided sources.
    
    Requirements:
    1. Language: KOREAN (한국어) for the content, but ENGLISH for the URL Slug.
    2. Length: **공백 제외 2500자 내외**. 내용을 아주 상세하고 전문적으로 작성할 것. (Reduced from 3500 for optimization)
    3. Recency: **CRITICAL**: This is 2026. Do NOT include tools or news from 2023/2024 unless they have a major 2026 update. Verify that the features mentioned are the LATEST ones. "최신" means 2026, not 2023.
    4. Title: 첫 줄에 한국어 제목을 <h2> 태그로 작성. **클릭율(CTR)을 극대화**하는 매력적인 제목 (호기심 유발, 질문 형태, 강렬한 형용사, 숫자 활용). 단순한 "2026년 OO 분석" 지양. **단, 본문에 없는 내용을 지어내거나 과장하여 사실을 왜곡하는 '거짓 낚시'는 절대 금지.**
    5. Tone: Professional yet accessible (Apple Korea style), engaging, insightful. NO Markdown formatting (###, **). Use HTML only.
    6. Structure:
       - Introduction: Hook the reader, explain why this matters. 첫 100단어 내에 핵심 키워드 포함.
       - Body: Analyze the facts from sources. Use <h3> for subtitles (2-4개).
       - Conclusion: Summary and future outlook.
    7. Content Enhancement:
       - **Images/Videos**: If the sources contain image or video URLs, DO NOT embed them directly. Instead, use a placeholder like "[IMAGE: detailed search query]" where an image would be appropriate.
       - Example: "[IMAGE: Samsung Galaxy S24 Ultra titanium gray back view]"
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
       SEO_SLUG: [seo-friendly-english-url-slug-2026] (lowercase, hyphens only, MUST be in English, include year if relevant)
       SEO_TITLE: [50-60자. "충격", "결국", "놀라운", "공개" 등 클릭을 유도하는 단어 포함 + 핵심 키워드]
       META_DESC: [150-160자의 메타 설명, 핵심 내용 요약, 검색 결과에 표시될 텍스트]
       FOCUS_KW: [가장 중요한 검색 키워드 1개, 예: "아이폰16 출시일" 또는 "ChatGPT 사용법"]
       <!--SEO_META_END-->
    
    Sources to use:
    ${context}
  `;

    try {
        const result = await generateContentWithRetry(prompt);
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
        let slug = "";

        if (seoMetaMatch) {
            const seoBlock = seoMetaMatch[1];

            const slugMatch = seoBlock.match(/SEO_SLUG:\s*(.+)/);
            if (slugMatch) slug = slugMatch[1].trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

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

        // Fallback: slug
        if (!slug) {
            // If slug is still empty, we might use a library or just leave it empty to let WP decide (but WP might use Korean title)
            // But we can try to transliterate or just use 'post-timestamp' as last resort? 
            // Better to leave it empty for WP to handle if AI fails, but user wants English.
            // Let's assume AI works most of the time. If not, WP default (Korean) is acceptable fallback for now.
            console.warn("[Gemini] No slug generated by AI.");
        }

        console.log(`[Gemini] SEO Generated - Title: ${seoTitle.slice(0, 30)}..., Keyphrase: ${focusKeyphrase}, Slug: ${slug}`);

        return {
            title: koreanTitle,
            content: text,
            slug,
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
        const result = await generateContentWithRetry(prompt);
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
