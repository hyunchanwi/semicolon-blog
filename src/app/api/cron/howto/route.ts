
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateContentWithRetry } from "@/lib/gemini";
import { TavilySearchProvider } from "@/lib/search/tavily";
import { getFeaturedImage } from "@/lib/images/unsplash";
import { uploadImageFromUrl, getOrCreateTag, getRecentAutomationPosts, isDuplicateIdeally, createPostWithIndexing, getRecentPostUrls } from "@/lib/wp-server";
import { getBestTopics, TrendingTopic } from "@/lib/trends/google-trends";
import { classifyContent } from "@/lib/category-rules";
import { googlePublishUrl } from "@/lib/google-indexing";
import { getVerifiedSubscribers } from "@/lib/subscribers";
import { sendNewPostNotification } from "@/lib/email";
import { stripHtml } from "@/lib/wp-api";
import { ensureHtml } from "@/lib/markdown-to-html";

// Configuration
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const CATEGORY_ID_HOWTO = 26; // '사용법' ID (Confirmed)
const CRON_SECRET = process.env.CRON_SECRET;
import { Agent, fetch as undiciFetch } from "undici";
const _http1Agent = new Agent({ allowH2: false });
const wpFetch = (url: string, opts: any = {}) => undiciFetch(url, { ...opts, dispatcher: _http1Agent }) as any;

// Topic Candidates Fallback
const SEARCH_QUERIES = [
    "아이폰과 갤럭시 파일 전송 방법",
    "계정 보안을 위한 2단계 인증(2FA) 설정 가이드",
    "최신 아이폰 필수 설정 및 꿀팁",
    "갤럭시 감춰진 유용한 기능 10가지",
    "유용한 AI 웹사이트 및 도구 사용법",
    "맥북 초보자를 위한 생산성 필수 단축키",
    "윈도우11 필수 최적화 설정 가이드",
    "노션(Notion) 완벽 기초 활용법",
    "ChatGPT 실무 활용 및 프롬프트 팁",
    "아이패드 굿노트 다이어리 정리 팁"
];

// 0. 최근 작성한 주제 가져오기
async function getRecentTopics(wpAuth: string): Promise<string[]> {
    try {
        if (!wpAuth) return [];
        const wpApiUrl = process.env.WP_API_URL || "https://wp.semicolonittech.com/wp-json/wp/v2";
        const res = await wpFetch(`${wpApiUrl}/posts?per_page=30&_fields=title`, {
            headers: { "Authorization": `Basic ${wpAuth}` },
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const posts: any[] = await res.json();
        return posts.map((p) => p.title?.rendered || '').filter(Boolean);
    } catch {
        return [];
    }
}

// 1. Get Topic (Trends + Tavily)
async function getHowToTopic(recentTopics: string[], existingPosts: any[], forceTopic?: string): Promise<any> {
    const tavily = new TavilySearchProvider(process.env.TAVILY_API_KEYS || process.env.TAVILY_API_KEY || "");

    let selectedTopic: TrendingTopic | null = null;
    let query = forceTopic;

    if (!query) {
        console.log("[HowTo] Fetching trends from Google Trends...");
        try {
            const candidates = await getBestTopics('KR', recentTopics);

            for (const t of candidates) {
                // IT 검증
                const predicted = classifyContent(t.title, '');
                if (predicted === 1) { // 1 = OTHER
                    console.log(`[HowTo] ⚠️ Skipping candidate "${t.title}" - Classified as OTHER`);
                    continue;
                }

                // [Duplicate Check]
                // ID for HowTo: "howto_{title}"
                const { isDuplicate, reason } = isDuplicateIdeally(`howto_${t.title}`, t.title, existingPosts);

                if (isDuplicate) {
                    console.log(`[HowTo] ⚠️ Skipping candidate "${t.title}" - ${reason}`);
                    continue;
                }

                selectedTopic = t;
                query = t.title;
                console.log(`[HowTo] 🎯 Topic selected from Trends: ${selectedTopic.title}`);
                break;
            }
        } catch (e) {
            console.error("[HowTo] Trend fetch failed, using fallback keyword", e);
        }
    }

    // Fallback if no trend found
    if (!query) {
        const randomIndex = Math.floor(Math.random() * SEARCH_QUERIES.length);
        query = SEARCH_QUERIES[randomIndex];
        console.log(`[HowTo] Using fallback keyword: ${query}`);
    }

    console.log(`[HowTo] Searching details for: ${query}`);
    const results = await tavily.search(`${query} 사용법 매뉴얼 가이드 tutorial guide`, { days: 30 });

    const validResults = results.filter((r: any) => r.title.length > 5 && r.content.length > 50);
    if (validResults.length === 0) return null;

    return {
        ...validResults[0],
        originalTrend: selectedTopic
    };
}

// 2. Generate Content (Gemini)
async function generateHowToContent(topic: any): Promise<{ title: string; content: string; slug: string }> {

    let recentPostsContext = "";
    try {
        console.log(`[HowTo] Fetching recent posts for internal linking...`);
        const recentPosts = await getRecentPostUrls(30);
        if (recentPosts && recentPosts.length > 0) {
            recentPostsContext = "\n\n## [블로그 기존 글 목록 (내부 링크용)]\n" +
                "아래는 우리 블로그에 이미 작성된 글 목록입니다. 본문을 작성하다가 맥락이 자연스럽게 이어질 때, 이 글들을 적극적으로 언급하며 HTML <a> 태그로 링크를 걸어주세요. (단, 과도하게 많이 넣지 말고 1~2개 정도 구글 SEO에 도움되도록 자연스럽게 삽입하세요.)\n" +
                recentPosts.map(p => `- 제목: ${p.title} (URL: ${p.url})`).join("\n");
        }
    } catch (e) {
        console.warn(`[HowTo] Failed to fetch recent posts: ${e}`);
    }

    const prompt = `
당신은 '매우 친절하고 꼼꼼한 IT 전문가'입니다. 현재 연도는 **2026년**입니다. 아래 주제에 대해 초보자도 100% 따라할 수 있는 **매우 상세하고 정확한 사용법 가이드**를 작성해주세요.

## 주제 정보
- 제목: ${topic.title}
- 참고 내용: ${topic.content}${recentPostsContext}

## 작성 원칙 (매우 중요)
1. **분량**: 핵심을 아주 상세하게 풀어내어 **공백 제외 3000자 이상** 작성하세요.
2. **최신성과 정확도**: 반드시 **2026년 최신 버전** 기준의 가장 정확한 기술 정보만 제공하세요. 작은 설정이나 버튼 이름 하나라도 틀리면 안 됩니다. 과거 연도(2023, 2024 등) 언급 금지.
3. **구조**: 
   - 매력적이고 친절한 서론 (독자의 문제 공감)
   - Step 1, Step 2 형태의 **구체적인 단계별 절차 (가장 중요)**
   - 장단점 비교 표 또는 꿀팁 요약 표
   - 따뜻한 맺음말
4. **이미지 (풍성하게)**: 글의 이해를 돕기 위해 단계별 설명 중간중간에 **[IMAGE: (영어 검색어)]**를 총 **3개~5개** 정도 적절히 배치해주세요. (예: [IMAGE: iPhone airdrop settings interface], [IMAGE: Galaxy quick share screen])
5. **어조**: 읽는 사람이 기분 좋아지는 매우 친절하고 상냥한 경어체 (~습니다, ~해요, ~해볼까요?).
6. **형식**: Markdown 문법(###, **, - 등)을 절대 사용하지 마세요. 오직 깔끔한 HTML 태그(<h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <table>, <a>)만 사용하세요.
7. **Slug**: 반드시 **영어 소문자와 하이픈(-)**만으로 구성된 URL Slug를 한글 없이 짧게 생성하세요.
8. **내부 링크**: 기존 글 목록 내용 중 현재 주제와 관련 있는 포스팅이 있다면 <a> 태그를 이용해 본문에 자연스럽게 링크를 걸어주세요.

## 출력 형식 (HTML + Meta)
- 시작점부터 곧바로 블로그 본문 HTML 코드를 작성하세요. (<body> 태그는 쓰지 말고 그 내부의 <h2>, <p>, <ul> 태그 등만 작성).
- 글 작성이 모두 끝난 맨 마지막에, 아래와 같은 메타데이터 블록을 덧붙여주세요:

<!--SEO_META_START-->
SEO_TITLE: [클릭을 유도하는 기사 제목. 시작 부분에 이모지 포함 가능]
SEO_SLUG: [해당 주제의 english-only-hyphen-separated-url-2026]
<!--SEO_META_END-->

주의: JSON, Markdown(\`\`\`) 등을 절대 사용하지 말고 순수 텍스트와 HTML로만 답하세요.`;

    // Google Search Grounding Enabled
    const result = await generateContentWithRetry(prompt, "gemini-2.5-flash", 3, true);
    const response = await result.response;
    let text = response.text().trim();

    let finalTitle = topic.title;
    let finalSlug = "";

    const titleMatch = text.match(/SEO_TITLE:\s*(.+)/);
    if (titleMatch) finalTitle = titleMatch[1].trim();

    const slugMatch = text.match(/SEO_SLUG:\s*(.+)/);
    if (slugMatch) finalSlug = slugMatch[1].trim();

    let finalContent = text.replace(/<!--SEO_META_START-->[\s\S]*<!--SEO_META_END-->/, '').trim();
    finalContent = finalContent.replace(/```html/g, "").replace(/```/g, "").trim();
    finalContent = ensureHtml(finalContent);

    return {
        title: finalTitle,
        content: finalContent,
        slug: finalSlug
    };
}

// 3. Process Images
async function processImages(content: string, wpAuth: string): Promise<string> {
    const tavily = new TavilySearchProvider(process.env.TAVILY_API_KEYS || process.env.TAVILY_API_KEY || "");
    const matches = content.match(/\[IMAGE: [^\]]+\]/g) || [];

    if (matches.length === 0) return content;

    let processedContent = content;
    console.log(`[HowTo] Processing ${matches.length} images in parallel...`);

    const imagePromises = matches.map(async (match) => {
        const query = match.replace('[IMAGE: ', '').replace(']', '').trim();
        try {
            let imageUrl = '';
            let credit = '';

            // Unsplash 우선 시도
            const unsplashImg = await getFeaturedImage(query);
            if (unsplashImg) {
                imageUrl = unsplashImg.url;
                credit = unsplashImg.credit;
            } else {
                const results = await tavily.search(`${query} screenshot interface`);
                // results가 배열이 아닐 경우 대비
                const bestResult = Array.isArray(results) ? results[0] : null;
                if (bestResult?.images?.[0]) {
                    imageUrl = bestResult.images[0];
                    credit = "Source: Web Search";
                }
            }

            if (imageUrl) {
                const uploaded = await uploadImageFromUrl(imageUrl, query, wpAuth);
                const finalUrl = uploaded ? uploaded.source_url : imageUrl;

                const imgHtml = `
                <figure class="wp-block-image size-large">
                    <img src="${finalUrl}" alt="${query}" style="border-radius:12px; box-shadow:0 8px 30px rgba(0,0,0,0.12); width:100%; height:auto;" />
                    <figcaption style="text-align:center; font-size:14px; color:#888; margin-top:8px;">${credit}</figcaption>
                </figure>`;
                return { match, imgHtml };
            }
        } catch (e) {
            console.error(`[HowTo] Image process fail: ${query}`, e);
        }
        return { match, imgHtml: "" };
    });

    const results = await Promise.all(imagePromises);

    for (const { match, imgHtml } of results) {
        processedContent = processedContent.replace(match, imgHtml);
    }

    return processedContent;
}

// Local publishPost removed. Using createPostWithIndexing from lib/wp-server.ts

export async function GET(request: NextRequest) {
    console.log("[HowTo] 🛑 API ROUTE HIT!");
    const wpAuth = (process.env.WP_AUTH || "").trim();

    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        // console.log("Unauthorized"); // Allow manual trigger for now with query param check? 
        // Or strictly enforce bearer.
    }

    const { searchParams } = new URL(request.url);
    const forceTopic = searchParams.get('force'); // Manual trigger

    try {
        console.log("[HowTo] 🚀 Starting How-To Guide generation...");

        // Add random jitter to prevent simultaneous execution race conditions
        // Reduce jitter for faster execution
        const jitter = Math.floor(Math.random() * 2000);
        await new Promise(resolve => setTimeout(resolve, jitter));

        // 0. Pre-fetch existing posts for batch duplicate checking
        const existingPosts = await getRecentAutomationPosts(wpAuth);

        // 0.5 최근 주제 가져오기
        const recentTopics = await getRecentTopics(wpAuth);

        // 1. Topic
        const topic = await getHowToTopic(recentTopics, existingPosts, forceTopic || undefined);
        if (!topic) {
            return NextResponse.json({ success: false, message: "No valid topic found" });
        }

        // 2. Content
        console.log(`[HowTo] Generating content for: ${topic.title}`);
        const generated = await generateHowToContent(topic);

        // 3. Images
        const finalContent = await processImages(generated.content, wpAuth);
        console.log(`[HowTo] ✅ Generated: ${generated.title}`);

        // [Race Condition Check] Final check right before publishing
        const { isDuplicate: finalDuplicate, reason: finalReason } = isDuplicateIdeally(`howto_${topic.title}`, topic.title, existingPosts);
        if (finalDuplicate) {
            console.log(`[HowTo] 🛑 Duplicate detected in final check for "${topic.title}". Skipping. (${finalReason})`);
            return NextResponse.json({ success: true, message: "Duplicate detected in final check" });
        }

        // 4. Publish
        const tagId = await getOrCreateTag("사용법", wpAuth);
        const tags = tagId ? [tagId] : [];

        // Generate Featured Image (Moved from removed publishPost)
        let featuredImg = await getFeaturedImage(generated.title);

        if (!featuredImg) {
            // Fallback: Use reliable random tech images
            const fallbacks = [
                "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200",
                "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200",
                "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1200",
                "https://images.unsplash.com/photo-1531297461136-82lw8fca8b66?auto=format&fit=crop&q=80&w=1200"
            ];
            const randomUrl = fallbacks[Math.floor(Math.random() * fallbacks.length)];
            featuredImg = { url: randomUrl, credit: "Unsplash (Fallback)" };
            console.log(`[HowTo] Using fallback thumbnail: ${randomUrl}`);
        }

        let mediaId = 0;

        if (featuredImg) {
            const uploaded = await uploadImageFromUrl(featuredImg.url, generated.title, wpAuth);
            if (uploaded) mediaId = uploaded.id;
        }

        const post = await createPostWithIndexing({
            title: generated.title,
            content: finalContent + `\n<!-- automation_source_id: howto_${topic.title} -->`,
            status: 'publish',
            slug: generated.slug || undefined,
            categories: [CATEGORY_ID_HOWTO],
            tags: tags,
            featured_media: mediaId > 0 ? mediaId : undefined,
            meta: {
                automation_source_id: `howto_${topic.title}`
            }
        }, wpAuth);

        if (!post) throw new Error("Failed to create post");

        const postAny = post as any;
        console.log(`[HowTo] Published: ${postAny.link}`);

        // Google Indexing API is correctly handled inside createPostWithIndexing now.
        // But the previous code had specific logging. createPostWithIndexing logs too.
        // We can just trust createPostWithIndexing.

        // 구독자 알림 발송 (비동기)
        getVerifiedSubscribers().then(async (subscribers) => {
            if (subscribers.length > 0) {
                const excerptText = stripHtml(finalContent).slice(0, 200) + "...";
                const postSlug = postAny.slug || (postAny.link || "").split("/").filter(Boolean).pop() || "";
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semicolonittech.com";
                await sendNewPostNotification(subscribers, {
                    title: generated.title,
                    excerpt: excerptText,
                    url: `${siteUrl}/blog/${postSlug}`,
                });
                console.log(`[HowTo] 📧 Sent notification to ${subscribers.length} subscribers`);
            }
        }).catch(err => {
            console.error("[HowTo] Subscriber notification failed:", err);
        });

        return NextResponse.json({
            success: true,
            id: post.id,
            link: postAny.link,
            topic: topic.title
        });

    } catch (e) {
        console.error("[HowTo] Error:", e);
        const message = e instanceof Error ? e.message : String(e);
        const lowerMsg = message.toLowerCase();
        const isTemporaryOrExternal = lowerMsg.includes("503") || lowerMsg.includes("429") || lowerMsg.includes("fetch failed") || lowerMsg.includes("tavily") || lowerMsg.includes("high demand") || lowerMsg.includes("service unavailable") || lowerMsg.includes("exceed");

        return NextResponse.json(
            { success: false, error: message },
            { status: isTemporaryOrExternal ? 200 : 500 }
        );
    }
}
