import { config } from "dotenv";
config({ path: ".env.local" });

import { GoogleGenerativeAI } from "@google/generative-ai";
import { TavilySearchProvider } from "../src/lib/search/tavily";
import { getFeaturedImage } from "../src/lib/images/unsplash";
import { uploadImageFromUrl, getOrCreateTag } from "../src/lib/wp-server";
import { ensureHtml } from "../src/lib/markdown-to-html";

// --- Copied Logic from route.ts (Simplified for CLI) ---

const CATEGORY_ID_HOWTO = 26;
const WP_API_URL = process.env.WP_API_URL || "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

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

import { getBestTopics, TrendingTopic } from "../src/lib/trends/google-trends";
import { classifyContent } from "../src/lib/category-rules";

async function getHowToTopic(forceTopic?: string): Promise<any> {
    const tavily = new TavilySearchProvider(process.env.TAVILY_API_KEY || "");
    let query = forceTopic;

    if (!query) {
        console.log("[HowTo] Fetching trends from Google Trends...");
        try {
            // Mock empty recent topics for debug
            const candidates = await getBestTopics('KR', []);
            console.log(`[Debug] Candidates found: ${candidates.map(c => c.title).join(', ')}`);

            for (const t of candidates) {
                const predicted = classifyContent(t.title, '');
                console.log(`[Debug] Checking candidate: "${t.title}" -> Predicted Category: ${predicted}`);
                if (predicted !== 1) { // 1 = OTHER
                    query = t.title;
                    console.log(`[HowTo] Selected trend: ${query} (IT Category: ${predicted})`);
                    break;
                }
            }
        } catch (e) {
            console.error("[HowTo] Trend fetch failed", e);
        }
    }

    if (!query) {
        const randomIndex = Math.floor(Math.random() * SEARCH_QUERIES.length);
        query = SEARCH_QUERIES[randomIndex];
        console.log(`[HowTo] Using fallback: ${query}`);
    }

    console.log(`[HowTo] Searching details for: ${query}`);
    const results = await tavily.search(`${query} 사용법 매뉴얼 가이드 tutorial guide`, { days: 30 });
    const validResults = results.filter((r: any) => r.title.length > 5 && r.content.length > 50);
    if (validResults.length === 0) return null;
    return validResults[0];
}

async function generateHowToContent(topic: any): Promise<{ title: string; content: string }> {
    console.log(`[HowTo] Generating content for: ${topic.title}`);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
당신은 '친절하고 꼼꼼한 IT 강사'입니다. 아래 주제에 대해 초보자도 쉽게 따라할 수 있는 블로그 포스팅을 작성해주세요.

## 주제 정보
- 제목: ${topic.title}
- 참고 내용: ${topic.content}
- URL: ${topic.url}

## 작성 원칙 (매우 중요)
1. **분량**: **공백 제외 2500자 내외** (핵심 내용 위주로 알차게). (CLI 테스트용 축소)
2. **구조**: 제목, 서론, 준비물, 단계별 절차, 결론
3. **시각 자료**: [IMAGE: (영어 검색어)] 태그 사용
4. **출력 형식 (JSON Only)**: { "title": "...", "content": "..." }
JSON 외에 어떤 텍스트도 포함하지 마세요.
`;

    // ...
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.substring(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(text);
    parsed.content = ensureHtml(parsed.content);
    return parsed;
}

async function processImages(content: string, wpAuth: string): Promise<string> {
    const tavily = new TavilySearchProvider(process.env.TAVILY_API_KEY || "");
    const matches = content.match(/\[IMAGE: [^\]]+\]/g) || [];
    let processedContent = content;

    for (const match of matches) {
        const query = match.replace('[IMAGE: ', '').replace(']', '').trim();
        try {
            console.log(`[HowTo] Requesting image for: ${query}`);
            let imageUrl = '';
            let credit = '';

            const unsplashImg = await getFeaturedImage(query);
            if (unsplashImg) {
                imageUrl = unsplashImg.url;
                credit = unsplashImg.credit;
            } else {
                const tRes = await tavily.search(`${query} screenshot interface`);
                if (tRes[0]?.images?.[0]) {
                    imageUrl = tRes[0].images[0];
                    credit = "Source: Web Search";
                }
            }

            if (imageUrl) {
                console.log(`[HowTo] Uploading content image...`);
                // Skip actual upload for CLI test to save time/bandwidth, just replace with URL
                // const uploaded = await uploadImageFromUrl(imageUrl, query, wpAuth);
                // const finalUrl = uploaded ? uploaded.url : imageUrl;
                const finalUrl = imageUrl;

                const imgHtml = `<img src="${finalUrl}" alt="${query}" style="width:100%; height:auto;" /><br/><small>${credit}</small>`;
                processedContent = processedContent.replace(match, imgHtml);
            } else {
                processedContent = processedContent.replace(match, "");
            }
        } catch (e) {
            console.error(`[HowTo] Image process fail: ${query}`, e);
            processedContent = processedContent.replace(match, "");
        }
    }
    return processedContent;
}

async function publishPost(title: string, content: string, tags: number[]) {
    if (!WP_AUTH) throw new Error("No WP_AUTH");
    console.log(`[HowTo] Publishing post: ${title}...`);

    // Actual Publish for Debugging
    const res = await fetch(`${WP_API_URL}/posts`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${WP_AUTH}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title,
            content,
            status: 'publish', // or 'draft' if we want to be safe, but user said "not working"
            tags,
            categories: [CATEGORY_ID_HOWTO], // Fix: Add category assignment
            meta: {
                automation_source_id: `howto_debug_${Date.now()}`
            }
        })
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`WP Publish Failed: ${errText}`);
    }

    const json = await res.json();
    console.log(`✅ Passed! Post Published: ID ${json.id}, Link: ${json.link}`);
    return json;
}

async function main() {
    try {
        const topic = await getHowToTopic();
        if (!topic) {
            console.log("No topic found.");
            return;
        }
        const generated = await generateHowToContent(topic);
        const finalContent = await processImages(generated.content, WP_AUTH);
        await publishPost(generated.title, finalContent, []);
        console.log("Done!");
    } catch (e) {
        console.error(e);
    }
}

main();
