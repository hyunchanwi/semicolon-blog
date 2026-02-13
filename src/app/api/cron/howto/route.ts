
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { TavilySearchProvider } from "@/lib/search/tavily";
import { getFeaturedImage } from "@/lib/images/unsplash";
import { uploadImageFromUrl, getOrCreateTag, checkAutomationDuplicate } from "@/lib/wp-server";
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
const WP_API_URL = process.env.WP_API_URL || "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

// Topic Candidates Fallback
const SEARCH_QUERIES = [
    "최신 아이폰 꿀팁 사용법",
    "갤럭시 숨겨진 기능 사용법",
    "유용한 AI 도구 사용법 가이드",
    "맥북 생산성 향상 팁",
    "윈도우11 필수 설정 가이드",
    "노션 사용법 기초",
    "굿노트 다이어리 꾸미기 팁",
    "ChatGPT 활용 팁",
    "유튜브 프리미엄 활용법",
    "인스타그램 릴스 만드는 법"
];

// 0. 최근 작성한 주제 가져오기
async function getRecentTopics(): Promise<string[]> {
    try {
        if (!WP_AUTH) return [];
        const res = await fetch(`${WP_API_URL}/posts?per_page=30&_fields=title`, {
            headers: { "Authorization": `Basic ${WP_AUTH}` },
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
async function getHowToTopic(recentTopics: string[], forceTopic?: string): Promise<any> {
    const tavily = new TavilySearchProvider(process.env.TAVILY_API_KEY || "");

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
                const { exists } = await checkAutomationDuplicate(`howto_${t.title}`, WP_AUTH);
                if (exists) {
                    console.log(`[HowTo] ⚠️ Skipping candidate "${t.title}" - Already published (Meta Match)`);
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
async function generateHowToContent(topic: any): Promise<{ title: string; content: string }> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
당신은 'IT 강사'입니다. 현재 연도는 **2026년**입니다. 아래 주제에 대해 초보자용 **최신 사용법 가이드** 포스팅을 작성해주세요.

## 주제 정보
- 제목: ${topic.title}
- 참고 내용: ${topic.content}

## 작성 원칙
1. **분량**: **공백 제외 2500자 내외** (핵심 내용 위주로 알차게).
2. **최신성**: 반드시 **2026년의 최신 기술 트렌드**를 반영하며, 과거 연도(2023, 2024)가 포함되지 않도록 주의하세요.
3. **구조**: 제목, 서론, 단계별 절차, 표(비교), 결론.
4. **이미지**: 설명 중간에 **[IMAGE: (영어 검색어)]**를 딱 **2개**만 삽입하세요.
5. **어조**: 친절한 경어체.
6. **형식**: Markdown 문법(###, **, - 등)을 절대 사용하지 마세요. 오직 HTML 태그(<h3>, <p>, <ul>, <li>, <strong>)만 사용하세요.

## 출력 형식 (JSON Only)
{
  "title": "블로그 제목",
  "content": "HTML 코드 (<body> 내부 내용만)"
}
JSON 외에 어떤 텍스트도 포함하지 마세요.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Robust JSON cleanup: Find first { and last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.substring(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(text);
    // Ensure HTML if Markdown leaks
    parsed.content = ensureHtml(parsed.content);

    return parsed;
}

// 3. Process Images
async function processImages(content: string, wpAuth: string): Promise<string> {
    const tavily = new TavilySearchProvider(process.env.TAVILY_API_KEY || "");
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
                const finalUrl = uploaded ? uploaded.url : imageUrl;

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

// 4. Publish
async function publishPost(title: string, content: string, tags: number[], originalTitle: string) {
    if (!WP_AUTH) throw new Error("No WP_AUTH");

    // Generate Featured Image
    const featuredImg = await getFeaturedImage(title) || await getFeaturedImage("technology guide");
    let mediaId = 0;

    if (featuredImg) {
        const uploaded = await uploadImageFromUrl(featuredImg.url, title, WP_AUTH);
        if (uploaded) mediaId = uploaded.id;
    }

    const res = await fetch(`${WP_API_URL}/posts`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${WP_AUTH}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title,
            content: content + `\n<!-- automation_source_id: howto_${originalTitle} -->`,
            status: 'publish',
            categories: [CATEGORY_ID_HOWTO],
            tags: tags,
            featured_media: mediaId > 0 ? mediaId : undefined,
            meta: {
                automation_source_id: `howto_${originalTitle}` // Use original topic for ID
            }
        })
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function GET(request: NextRequest) {
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

        // 0. 최근 주제 가져오기
        const recentTopics = await getRecentTopics();

        // 1. Topic
        const topic = await getHowToTopic(recentTopics, forceTopic || undefined);
        if (!topic) {
            return NextResponse.json({ success: false, message: "No valid topic found" });
        }

        // 2. Content
        console.log(`[HowTo] Generating content for: ${topic.title}`);
        const generated = await generateHowToContent(topic);

        // 3. Images
        const finalContent = await processImages(generated.content, WP_AUTH);
        console.log(`[HowTo] ✅ Generated: ${generated.title}`);

        // [Race Condition Check] Final check right before publishing
        const { exists: finalExists } = await checkAutomationDuplicate(`howto_${topic.title}`, WP_AUTH);
        if (finalExists) {
            console.log(`[HowTo] 🛑 Duplicate detected in final check for "${topic.title}". Skipping.`);
            return NextResponse.json({ success: true, message: "Duplicate detected in final check" });
        }

        // 4. Publish
        const tagId = await getOrCreateTag("사용법", WP_AUTH);
        const tags = tagId ? [tagId] : [];

        const post = await publishPost(generated.title, finalContent, tags, topic.title);

        console.log(`[HowTo] Published: ${post.link}`);

        // Google Indexing API 알림
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semicolonittech.com";
        const postSlug = (post as any).slug || post.link.split("/").filter((s: string) => s).pop();
        const publicUrl = `${siteUrl}/blog/${postSlug}`;

        console.log(`[HowTo] 📡 Notifying Google Indexing for: ${publicUrl}`);
        googlePublishUrl(publicUrl).catch(err => {
            console.error("[HowTo] Google Indexing failed:", err);
        });

        // 구독자 알림 발송 (비동기)
        getVerifiedSubscribers().then(async (subscribers) => {
            if (subscribers.length > 0) {
                const excerptText = stripHtml(finalContent).slice(0, 200) + "...";
                const slug = post.link.split("/").pop() || "";
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semicolon-blog.vercel.app";
                await sendNewPostNotification(subscribers, {
                    title: generated.title,
                    excerpt: excerptText,
                    url: `${siteUrl}/blog/${slug}`,
                });
                console.log(`[HowTo] 📧 Sent notification to ${subscribers.length} subscribers`);
            }
        }).catch(err => {
            console.error("[HowTo] Subscriber notification failed:", err);
        });

        return NextResponse.json({
            success: true,
            id: post.id,
            link: post.link,
            topic: topic.title
        });

    } catch (e) {
        console.error("[HowTo] Error:", e);
        return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
    }
}
