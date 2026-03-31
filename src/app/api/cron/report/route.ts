// report/route.ts (Tech Report Analysis endpoint)
import { NextRequest, NextResponse } from "next/server";
import { generateContentWithRetry } from "@/lib/gemini";
import * as cheerio from "cheerio";
import { uploadImageFromUrl, getOrCreateTag, checkAutomationDuplicate, createPostWithIndexing, getRecentPostUrls } from "@/lib/wp-server";
import { getFeaturedImage } from "@/lib/images/unsplash";

export const maxDuration = 60; // 60s timeout for large context processing
export const dynamic = 'force-dynamic';

const CATEGORY_ID_TECH = 9; // IT/Tech
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!targetUrl) {
        return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 });
    }

    const WP_AUTH = (process.env.WP_AUTH || "").trim();
    if (!WP_AUTH) {
        return NextResponse.json({ error: "Missing WP credentials" }, { status: 500 });
    }

    try {
        console.log(`[Report] Fetching massive document from: ${targetUrl}`);

        // 1. Fetch and Parse Large Document
        const res = await fetch(targetUrl);
        if (!res.ok) throw new Error(`Failed to fetch Target URL. Status: ${res.status}`);

        const html = await res.text();
        const $ = cheerio.load(html);

        // Remove scripts, styles, nav, footer to extract raw text (like Readability)
        $('script, style, nav, footer, header, aside, .ad, .advertisement').remove();
        const rawText = $('body').text().replace(/\s+/g, ' ').trim();
        const docTitle = $('title').text() || "Tech Report";

        if (rawText.length < 500) {
            return NextResponse.json({ error: "Document too short or unreadable." }, { status: 400 });
        }

        console.log(`[Report] Extracted ${rawText.length} characters of raw text.`);

        // 2. Duplicate Check
        const { exists } = await checkAutomationDuplicate(`report_${targetUrl}`, WP_AUTH);
        if (exists) {
            return NextResponse.json({ message: "Task was skipped: already processed this URL" }, { status: 200 });
        }

        // 3. Fetch Recent Posts for Context
        let recentPostsContext = "";
        try {
            const recentPosts = await getRecentPostUrls(30);
            if (recentPosts && recentPosts.length > 0) {
                recentPostsContext = "\n\n## [블로그 기존 글 목록 (내부 링크용)]\n" +
                    "아래는 우리 블로그에 이미 작성된 글 목록입니다. 본문을 작성하다가 맥락이 자연스럽게 이어질 때, 이 글들을 적극적으로 언급하며 HTML <a> 태그로 링크를 걸어주세요.\n" +
                    recentPosts.map(p => `- 제목: ${p.title} (URL: ${p.url})`).join("\n");
            }
        } catch (e) {
            console.warn(`[Report] Failed to fetch recent posts: ${e}`);
        }

        // 4. Generate Huge Content using Gemini 2.5 Flash
        const prompt = `
당신은 '세미콜론 IT 블로그'의 수석 테크 칼럼니스트입니다. 연도는 2026년입니다.
아래 제공된 [원본 문서 텍스트]는 방대한 분량의 기업 실적 발표, 영문 기술 문서, 또는 심층 리뷰 기사 등입니다.
이 방대한 내용을 한국 독자들이 아주 빠르고 깊이 있게 이해할 수 있도록, 번역과 핵심 요약이 가미된 **프리미엄 심층 테크 칼럼**으로 변환해 주세요.

[원본 문서 제목]: ${docTitle}
[원본 URL]: ${targetUrl}${recentPostsContext}

[원본 문서 텍스트 (앞부분 5만자 제한)]:
${rawText.substring(0, 50000)}

## 작성 원칙:
1. **분량**: 공백 제외 최소 3000자 이상으로 매우 상세하고 깊이 있는 기사를 작성하세요.
2. **어조**: 전문가답게 분석적이고 통찰력 있는 장문체(~합니다, ~입니다).
3. **구조**:
   - 매력적인 한국어 서론 (문서의 중요성과 맥락 설명)
   - [핵심 하이라이트 요약] (3~5개 불렛 포인트)
   - [상세 분석 1], [상세 분석 2] 등의 명확한 소제목(<h3>)을 통한 본문 전개
   - 이 문서가 IT 산업(또는 소비자)에 미치는 거시적 '결론 및 전망'
4. **시각 자료**: 글 흐름상 이미지가 필요한 3개 이상의 지점에 **[IMAGE: 관련 영어 검색어]** 플레이스홀더 배치.
5. **형식**: Markdown 금지. 오직 순수 HTML 태그(<h2>, <h3>, <p>, <ul>, <li>, <strong>, <table>)만 사용하세요.
6. **내부 링크**: 기존 글 목록 내용 중 현재 주제와 관련 있는 포스팅이 있다면 <a> 태그를 이용해 전문적인 어조에 어울리게 자연스럽게 링크를 걸어주세요. 절대 링크를 지어내지 마세요.

## 출력 형식 (JSON Only):
{
  "title": "클릭을 유발하는 매력적인 한국어 제목",
  "content": "HTML 코드 (<body> 내부 내용만)",
  "slug": "english-only-hyphen-separated-url"
}
`;

        console.log(`[Report] Asking Gemini to analyze and write column...`);
        const result = await generateContentWithRetry(prompt, "gemini-2.5-flash", 3, true);
        let responseText = result.response.text().trim();
        responseText = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

        // Sometimes gemini might output trailing or leading characters, try to isolate json
        const firstBrace = responseText.indexOf('{');
        const lastBrace = responseText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            responseText = responseText.substring(firstBrace, lastBrace + 1);
        }

        let parsed;
        try {
            parsed = JSON.parse(responseText);
        } catch (e) {
            console.error("JSON parse failed. First 200 chars:", responseText.substring(0, 200));
            console.error("Last 200 chars:", responseText.substring(responseText.length - 200));
            throw new Error("Invalid output format from Gemini");
        }

        let finalContent = parsed.content || '';
        const finalTitle = parsed.title;
        const slug = parsed.slug;

        // 4. Image Placeholder Processing
        const imageMatches = finalContent.match(/\[IMAGE: [^\]]+\]/g);
        if (imageMatches && imageMatches.length > 0) {
            for (const match of imageMatches) {
                const query = match.replace('[IMAGE: ', '').replace(']', '').trim();
                let imgHtml = '';
                try {
                    const unsplashImg = await getFeaturedImage(query); // Tavily is removed here for speed, just use Unsplash
                    if (unsplashImg) {
                        imgHtml = `
                        <figure class="wp-block-image size-large">
                            <img src="${unsplashImg.url}" alt="${query}" style="border-radius:12px; box-shadow:0 8px 30px rgba(0,0,0,0.12); width:100%; height:auto;" />
                            <figcaption style="text-align:center; font-size:14px; color:#888; margin-top:8px;">${unsplashImg.credit}</figcaption>
                        </figure>`;
                    }
                } catch (e) { }
                finalContent = finalContent.replace(match, imgHtml);
            }
        }

        // Add Source
        finalContent += `
        <hr style="margin-top:40px; margin-bottom:20px;" />
        <p style="font-size:14px; color:#666;"><strong>출처 원문:</strong> <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${docTitle}</a></p>
        <!-- Hidden source id -->
        <div style="display:none;">report_${targetUrl}</div>
        `;

        // 5. Upload Featured Image
        let featuredMediaId = 0;
        const mainImage = await getFeaturedImage(finalTitle);
        if (mainImage) {
            const uploaded = await uploadImageFromUrl(mainImage.url, finalTitle, WP_AUTH);
            if (uploaded) featuredMediaId = uploaded.id;
        }

        // 6. Push to WordPress
        const wpPostStatus = 'publish';
        const postData = {
            title: finalTitle,
            content: finalContent,
            status: wpPostStatus,
            categories: [CATEGORY_ID_TECH],
            featured_media: featuredMediaId,
            slug: slug
        };

        const wpResult = await createPostWithIndexing(postData, WP_AUTH);

        if (!wpResult) {
            return NextResponse.json({ error: "Failed to publish to WordPress" }, { status: 500 });
        }

        console.log(`[Report] ✅ Successfully generated and published Tech Report: ${(wpResult as any).link}`);
        return NextResponse.json({
            message: "Report published successfully",
            title: finalTitle,
            link: (wpResult as any).link
        }, { status: 200 });

    } catch (e: any) {
        console.error("[Report] Error:", e);
        const message = e.message || String(e);
        const lowerMsg = message.toLowerCase();
        const isTemporaryOrExternal = lowerMsg.includes("503") || lowerMsg.includes("429") || lowerMsg.includes("fetch failed") || lowerMsg.includes("tavily") || lowerMsg.includes("high demand") || lowerMsg.includes("service unavailable") || lowerMsg.includes("exceed");

        return NextResponse.json(
            { success: false, error: message },
            { status: isTemporaryOrExternal ? 200 : 500 }
        );
    }
}
