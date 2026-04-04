
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateContentWithRetry } from "@/lib/gemini";

import { getFeaturedImage } from "@/lib/images/unsplash";
import { uploadImageFromUrl, getOrCreateTag, getRecentAutomationPosts, isDuplicateIdeally, checkAutomationDuplicate, createPostWithIndexing, getRecentPostUrls } from "@/lib/wp-server";
import { googlePublishUrl } from "@/lib/google-indexing";
import {
    getAllLatestVideos,
    createVideoPrompt,
    YouTubeVideo,
    channels
} from "@/lib/youtube-channels";
import { TavilySearchProvider } from "@/lib/search/tavily";
import { classifyContent } from "@/lib/category-rules";
import { getVerifiedSubscribers } from "@/lib/subscribers";
import { sendNewPostNotification } from "@/lib/email";
import { stripHtml } from "@/lib/wp-api";
import { ensureHtml } from "@/lib/markdown-to-html";

// Types
interface WPCreatedPost {
    id: number;
    link: string;
}

// Configuration
export const maxDuration = 60; // Set timeout to 60s
export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET;
const CATEGORY_ID_GADGET = 4;
const CATEGORY_ID_TECH = 9;
const CATEGORY_ID_AI = 15;
const WP_API_URL = process.env.WP_API_URL || "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

// Force HTTP/1.1 for Hostinger (blocks HTTP/2)
import { Agent, fetch as undiciFetch } from "undici";
const _http1Agent = new Agent({ allowH2: false });
const wpFetch = (url: string, opts: any = {}) => undiciFetch(url, { ...opts, dispatcher: _http1Agent }) as any;

// Gemini로 블로그 글 생성
async function generateFromVideo(video: YouTubeVideo): Promise<{ title: string; content: string; slug?: string; unsplashKeyword: string }> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    // v1.5 Pro 모델 수준의 멀티모달 분석을 위해 flash 대신 기본 제공되거나 명시된 최신 모델 사용 (보통 flash도 멀티모달 지원함)
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        tools: [{ googleSearch: {} } as any]
    });

    // video.id는 footer embed용으로만 사용하고, 프롬프트에는 포함하지 않음 (상단 오염 방지)

    // ...

    const tavily = new TavilySearchProvider(process.env.TAVILY_API_KEYS || process.env.TAVILY_API_KEY || "");
    let externalContext = "";
    try {
        console.log(`[YouTube] Fetching external context for: ${video.title}`);
        const searchResults = await tavily.search(video.title, { maxResults: 3, days: 14 });
        if (searchResults && searchResults.length > 0) {
            externalContext = "\n\n## [관련 최신 웹 정보 (외부 컨텍스트)]\n" +
                "아래 정보를 활용하여 영상 내용의 신빙성을 높이고 더 깊은 배경지식을 더해주세요:\n" +
                searchResults.map(r => `- ${r.title}: ${r.content}`).join("\n");
        }
    } catch (e) {
        console.warn(`[YouTube] Failed to fetch external context: ${e}`);
    }

    let recentPostsContext = "";
    try {
        console.log(`[YouTube] Fetching recent posts for internal linking...`);
        const recentPosts = await getRecentPostUrls(30);
        if (recentPosts && recentPosts.length > 0) {
            recentPostsContext = "\n\n## [블로그 기존 글 목록 (내부 링크용)]\n" +
                "아래는 우리 블로그에 이미 작성된 글 목록입니다. 본문을 작성하다가 맥락이 자연스럽게 이어질 때, 이 글들을 적극적으로 언급하며 HTML <a> 태그로 링크를 걸어주세요. (예: <a href=\"/blog/...\">...에 대해 더 알아보기</a>)\n" +
                recentPosts.map(p => `- 제목: ${p.title} (URL: ${p.url})`).join("\n");
        }
    } catch (e) {
        console.warn(`[YouTube] Failed to fetch recent posts: ${e}`);
    }

    const prompt = `현재 연도는 **2026년**입니다. 당신은 전문 IT 기술 칼럼니스트로서 첨부된 썸네일(이미지) 정보, 아래 영상 내용, 최신 웹 정보를 종합하여 깊이 있고 전문적인 블로그 포스팅을 작성해야 합니다.
${createVideoPrompt(video)}${externalContext}${recentPostsContext}

## 작성 원칙 (매우 중요)
1. **분량**: 핵심 내용과 기술적 배경을 매우 상세하게 풀어내어 **공백 제외 최소 2500자 이상 (아주 길게)** 작성하세요. 대충 요약하지 말고 논문이나 심층 칼럼 수준으로 딥다이브(Deep-dive)할 것.
2. **최신성**: 반드시 **2026년의 관점**에서 최신 트렌드를 반영하세요.
3. **어조**: 전문 IT 칼럼니스트 장문체의 어조로 작성하세요. (~합니다, ~입니다 체 사용). 영상 출처를 직접 언급하지 말고, 본인이 직접 취재하고 분석한 것처럼 당당하고 전문적인 태도를 유지할 것.
4. **외부 컨텍스트 활용**: 제공된 [관련 최신 웹 정보]를 적극 활용하여, 영상에서 부족한 팩트나 시장 상황, 가격 정보 등을 풍부하게 보충하세요.
5. **내부 링크 (SEO)**: 제공된 [블로그 기존 글 목록] 중 현재 주제와 관련 있는 글이 있다면, 본문 흐름에 아주 자연스럽게 녹여내어 최소 1~2개의 내부 링크(<a href="...">)를 삽입하세요. 억지로 넣지 말고 문맥이 맞을 때만 사용하세요.
6. **시각적 묘사 (멀티모달)**: 첨부된 이미지(유튜브 썸네일)를 직접 눈으로 관찰하고, 기기의 디자인, 영상 속 그래프나 핵심 시각 자료 등의 구체적인 특징을 본문 속에 매우 자연스럽게 묘사해 넣으세요. (예: "공개된 모습을 살펴보면 기기 후면의 무광 마감이...", "테스트 결과를 보면...")
7. **형식**: Markdown 문법(###, **, - 등)을 절대 사용하지 마세요. **오직 HTML 태그** (<h3>, <p>, <ul>, <ol>, <li>, <strong>, <table>, <a>)만 사용해야 합니다.

## 본문 구성 지침
- **제목**: **클릭을 유도하는 매력적인 제목** (35자 이내). (예: "2026년, X가 세상을 지배하는 이유! 완벽 분석" 등)
- **서론**: 독자의 공감을 이끌어내고 기술/제품의 현재 상황을 거시적으로 짚어주며 흥미롭게 시작 (500자 이상).
- **핵심 요약 (Key Highlights)**: 본문 시작 전, 독자를 위해 가장 중요한 포인트 3~5가지를 불렛 포인트로 명확하게 짚어주는 인트로 섹션 구축.
- **심층 분석 (Deep Dive)**: 3개 이상의 소제목(<h3>)으로 나누어, 단순 소개를 넘어선 **원리 분석, 장단점 비교, 경쟁사와의 차이, 시장의 반응** 등을 매우 상세히 서술할 것. 첨부된 이미지를 분석한 내용도 이곳에 적절히 녹여내세요.
- **결론 및 시사점**: 단순한 마무리 인사가 아니라, 이 주제가 우리 삶이나 산업에 미치는 영향을 명확히 분석하며 묵직하게 끝맺음할 것.

## 시각 자료 배치
- 글의 흐름에 따라 **[IMAGE: (관련 기술/기기 영어 검색어)]** 플레이스홀더를 적절히 삽입하세요.
- 최소 4개 이상의 이미지가 필요합니다.

## 금지 사항
- 유튜브, 유튜버 이름, 채널 언급 금지 (마치 직접 분석한 글처럼 작성).
- 영상 주소나 임베드 코드 본문 내 삽입 금지.
- "이 영상에서", "영상에 따르면", "첨부된 이미지를 보면" 등 출처나 AI의 한계를 대놓고 밝히는 표현 절대 금지.
- Markdown 헤더(###) 사용 금지.

## 출력 형식 (HTML + Meta)
- 시작점부터 곧바로 블로그 본문 HTML 코드를 작성하세요. (<body> 태그는 쓰지 말고 그 내부의 <h3>, <p>, <ul> 태그 등만 작성).
- 글 작성이 모두 끝난 맨 마지막에, 아래와 같은 메타데이터 블록을 덧붙여주세요:

<!--SEO_META_START-->
SEO_TITLE: [클릭을 유도하는 기사 제목. 이모지 포함 가능]
SEO_SLUG: [해당 주제의 english-only-hyphen-separated-url]
UNSPLASH_KEYWORD: [글 내용과 어울리는 아주 포괄적이고 넓은 의미의 영어 단어 1~2개. (예: computer, smartphone office, modern desk, technology abstract) 절대 고유명사나 복잡한 문장을 쓰지 마세요.]
<!--SEO_META_END-->

주의: JSON, Markdown(\`\`\`) 등을 절대 사용하지 말고 순수 텍스트와 HTML로만 답하세요.`;

    let result;
    try {
        console.log(`[YouTube] Fetching thumbnail for multimodal analysis: ${video.thumbnailUrl}`);
        const imgRes = await fetch(video.thumbnailUrl || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`);
        if (!imgRes.ok) throw new Error("Failed to fetch image");

        const arrayBuffer = await imgRes.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType
            }
        };

        // Custom retry logic here since we need to pass parts array instead of just a string prompt
        result = await model.generateContent([prompt, imagePart]);
    } catch (e) {
        console.warn(`[YouTube] Multimodal fetch failed, falling back to text-only prompt: ${e}`);
        result = await model.generateContent(prompt);
    }
    const response = await result.response;
    let text = response.text().trim();

    // 1. JSON 대신 정규식으로 Meta 추출
    let finalTitle = video.title;
    let finalSlug = "";
    let unsplashKeyword = "technology";

    const titleMatch = text.match(/SEO_TITLE:\s*(.+)/);
    if (titleMatch) finalTitle = titleMatch[1].trim();

    const slugMatch = text.match(/SEO_SLUG:\s*(.+)/);
    if (slugMatch) finalSlug = slugMatch[1].trim();

    const unsplashMatch = text.match(/UNSPLASH_KEYWORD:\s*(.+)/);
    if (unsplashMatch) unsplashKeyword = unsplashMatch[1].trim();

    // 본문 추출 및 정제
    let finalContent = text.replace(/<!--SEO_META_START-->[\s\S]*<!--SEO_META_END-->/, '').trim();
    finalContent = finalContent.replace(/```html/g, "").replace(/```/g, "").trim(); // 혹시 모를 마크다운 제거
    finalContent = ensureHtml(finalContent);

    try {
        // 0. (중요) 상단 영상 링크/임베드 제거 (정규식)
        // AI가 지시를 어기고 상단에 영상을 넣는 경우를 대비해 태그 및 링크 제거
        finalContent = finalContent
            .replace(/<iframe[^>]*youtube[^>]*><\/iframe>/gi, '') // iframe 제거
            .replace(/<div class="video-container"[^>]*>[\s\S]*?<\/div>/gi, '') // video container 제거
            .replace(/https:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s<"']+/gi, ''); // 단순 링크 제거

        // Oembed figure 제거 추가
        finalContent = finalContent.replace(/<figure class="wp-block-embed is-type-video is-provider-youtube[^"]*"[^>]*>[\s\S]*?<\/figure>/gi, '');


        // 1. [IMAGE: ...] 플레이스홀더 처리 (병렬 처리로 속도 개선)
        const imageMatches = finalContent.match(/\[IMAGE: [^\]]+\]/g);

        if (imageMatches && imageMatches.length > 0) {
            const searcher = new TavilySearchProvider(process.env.TAVILY_API_KEYS || process.env.TAVILY_API_KEY || "");

            // 병렬로 이미지 검색 및 처리 시작
            const imagePromises = imageMatches.map(async (match: string) => {
                const query = match.replace('[IMAGE: ', '').replace(']', '').trim();
                let imgHtml = '';

                try {
                    console.log(`[YouTube] Searching image for: "${query}"`);
                    const results = await searcher.search(`${query} image`);
                    const bestResult = results.find((r: any) => r.images && r.images.length > 0);

                    let imageUrl = '';
                    let imageCredit = '';

                    if (bestResult && bestResult.images && bestResult.images.length > 0) {
                        imageUrl = bestResult.images[0];
                        imageCredit = 'Source: Internet';
                    } else {
                        // Fallback to Unsplash inside parallel task
                        const unsplashImg = await getFeaturedImage(query);
                        if (unsplashImg) {
                            imageUrl = unsplashImg.url;
                            imageCredit = unsplashImg.credit;
                        }
                    }

                    if (imageUrl) {
                        imgHtml = `
                        <figure class="wp-block-image size-large">
                            <img src="${imageUrl}" alt="${query}" style="border-radius:12px; box-shadow:0 8px 30px rgba(0,0,0,0.12); width:100%; height:auto;" />
                            <figcaption style="text-align:center; font-size:14px; color:#888; margin-top:8px;">${imageCredit}</figcaption>
                        </figure>`;
                    }
                } catch (e) {
                    console.error(`[YouTube] Tavily failed for ${query}, trying Unsplash fallback`, e);
                    try {
                        const unsplashImg = await getFeaturedImage(query);
                        if (unsplashImg) {
                            imgHtml = `
                            <figure class="wp-block-image size-large">
                                <img src="${unsplashImg.url}" alt="${query}" style="border-radius:12px; box-shadow:0 8px 30px rgba(0,0,0,0.12); width:100%; height:auto;" />
                                <figcaption style="text-align:center; font-size:14px; color:#888; margin-top:8px;">${unsplashImg.credit}</figcaption>
                            </figure>`;
                        }
                    } catch (unsplashErr) {
                        console.error(`[YouTube] Both Tavily and Unsplash failed for ${query}`, unsplashErr);
                    }
                }

                return { match, imgHtml };
            });

            // 모든 이미지 처리가 끝날 때까지 대기
            const processedImages = await Promise.all(imagePromises);

            // 본문 치환
            for (const { match, imgHtml } of processedImages) {
                if (imgHtml) {
                    finalContent = finalContent.replace(match, imgHtml);
                } else {
                    finalContent = finalContent.replace(match, ""); // 실패 시 제거
                }
            }
        }

        // 2. 영상 임베드 추가 (맨 아래 - 참고 영상)
        // 사용자 요청: "하단 참고 영상 필수: 원본 영상을 첨부, 링크는 삭제"
        const embedHtml = `
        <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e2e8f0;">
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem;">📺 참고 영상</h3>
            <div class="video-container" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:0.75rem;box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1);">
                <iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://www.youtube.com/embed/${video.id}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
            <!-- Hidden original link for duplicate tracking -->
            <div style="display:none;" class="original-video-link">https://www.youtube.com/watch?v=${video.id}</div>
        </div>
        `;

        finalContent += embedHtml;

        return {
            title: finalTitle,
            content: finalContent,
            slug: finalSlug,
            unsplashKeyword: unsplashKeyword
        };
    } catch (e) {
        console.error("[YouTube] Failed to parse Gemini response or process images:", e);
        // 폴백: 영상 제목 사용, 영상 임베드 하단 포함 (링크 제외)
        return {
            title: video.title,
            content: `<p>${video.description}</p><p>(AI가 내용을 요약하는 데 실패했습니다. 원본 영상을 참고해 주세요.)</p>
            <div style="margin-top: 2rem;">
                <iframe width="100%" height="315" src="https://www.youtube.com/embed/${video.id}" frameborder="0" allowfullscreen></iframe>
            </div>`,
            unsplashKeyword: "technology error"
        };
    }
}

// WordPress에 글 발행
// Local publishPost removed. Using createPostWithIndexing from lib/wp-server.ts

/**
 * Finds the index of the channel used in the last published YouTube post.
 * Uses Tags to identify the channel name.
 */
async function getLastUsedChannelIndex(): Promise<number> {
    try {
        const youTubeTagId = await getOrCreateTag("YouTube", WP_AUTH);
        if (!youTubeTagId) return -1;

        // Fetch latest post with YouTube tag
        const res = await wpFetch(`${WP_API_URL}/posts?tags=${youTubeTagId}&per_page=1&_embed`, {
            headers: { 'Authorization': `Basic ${WP_AUTH}` },
            cache: 'no-store'
        });

        if (!res.ok) return -1;
        const posts = await res.json();
        if (posts.length === 0) return -1;

        const lastPost = posts[0];

        // Check Tags for Channel Name
        // We need to fetch tag details because embed might not give full names easily or we just scan IDs
        // But simpler: Check if we saved 'youtube_channel' in meta?
        if (lastPost.meta?.youtube_channel) {
            const chName = lastPost.meta.youtube_channel;
            const idx = channels.findIndex(c => c.name === chName);
            if (idx !== -1) {
                console.log(`[YouTube] Found last used channel via Meta: ${chName} (Index ${idx})`);
                return idx;
            }
        }

        // Fallback: Check tags
        // This requires fetching all tags of the post
        if (lastPost.tags && lastPost.tags.length > 0) {
            // This is expensive (N requests), but okay for cron.
            // Better: fetch all tags involved.
            const tagsRes = await wpFetch(`${WP_API_URL}/tags?include=${lastPost.tags.join(',')}`, {
                headers: { 'Authorization': `Basic ${WP_AUTH}` }
            });
            if (tagsRes.ok) {
                const tags = await tagsRes.json();
                for (const t of tags) {
                    const idx = channels.findIndex(c => c.name.toLowerCase() === t.name.toLowerCase());
                    if (idx !== -1) {
                        console.log(`[YouTube] Found last used channel via Tag: ${channels[idx].name} (Index ${idx})`);
                        return idx;
                    }
                }
            }
        }

        return -1;
    } catch (e) {
        console.error("[YouTube] Error finding last channel:", e);
        return -1;
    }
}

export async function GET(request: NextRequest) {
    // Auth check
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        // Allow for testing
        console.log("[YouTube] Warning: No auth header");
    }

    try {
        console.log("[YouTube] 🎬 Starting YouTube-based post generation (Stateful Rotation)...");

        // Add random jitter to prevent simultaneous execution race conditions
        // Reduce jitter for faster execution
        const jitter = Math.floor(Math.random() * 2000);
        await new Promise(resolve => setTimeout(resolve, jitter));

        // 1. Determine Next Channel (Stateful Rotation)
        let initialChannelIndex = 0;

        // Check for manual force
        const { searchParams } = new URL(request.url);
        const forceIndex = searchParams.get('force');

        if (forceIndex) {
            initialChannelIndex = parseInt(forceIndex);
            console.log(`[YouTube] 🔧 Manual Override: Forcing channel index to ${initialChannelIndex}`);
        } else {
            // Automatic Rotation
            const lastIdx = await getLastUsedChannelIndex();
            initialChannelIndex = (lastIdx !== -1) ? (lastIdx + 1) % channels.length : 0;
            console.log(`[YouTube] 🔄 Rotation start: index ${initialChannelIndex}`);
        }

        let targetVideo: YouTubeVideo | null = null;
        let selectedChannel = channels[initialChannelIndex];
        let checkedVideosLog: any[] = [];

        // 0. Pre-fetch existing posts for batch duplicate checking
        const existingPosts = await getRecentAutomationPosts(WP_AUTH);

        // Try ALL channels sequentially to ensure we find something to post
        for (let attempt = 0; attempt < channels.length; attempt++) {
            const channelIdx = (initialChannelIndex + attempt) % channels.length;
            selectedChannel = channels[channelIdx];
            console.log(`[YouTube] 🎯 Checking Channel: ${selectedChannel.name} (Attempt ${attempt + 1})`);

            const { videos: allVideos } = await getAllLatestVideos(selectedChannel.name);
            const targetVideos = allVideos.filter(v => v.channelId === selectedChannel.id);

            if (targetVideos.length === 0) {
                console.log(`[YouTube] ⚠️ No recent (14d) videos for ${selectedChannel.name}.`);
                continue;
            }

            // Check top 5 videos of the channel
            const checkLimit = Math.min(targetVideos.length, 5);
            const candidateVideos = targetVideos.slice(0, checkLimit);

            console.log(`[YouTube] 🔍 Checking top ${checkLimit} videos for duplicates (Memory Check)...`);

            for (const v of candidateVideos) {
                // 1차: 단기 메모리(100개) 내부 텍스트 검사
                let { isDuplicate, reason } = isDuplicateIdeally(v.id, v.title, existingPosts);

                // 2차: 장기 메모리 확인 (WP DB 전체 검색)
                if (!isDuplicate) {
                    const dbCheck = await checkAutomationDuplicate(v.id, WP_AUTH);
                    if (dbCheck.exists) {
                        isDuplicate = true;
                        reason = `Found in WP DB (Long-term check): ${v.id}`;
                    }
                }

                checkedVideosLog.push({
                    channel: selectedChannel.name,
                    id: v.id,
                    title: v.title,
                    isDuplicate,
                    reason
                });

                if (!isDuplicate) {
                    targetVideo = v;
                    break;
                } else {
                    console.log(`[YouTube] 🚫 Duplicate skipped: "${v.title}" (${reason})`);
                }
            }

            if (targetVideo) break;
            console.log(`[YouTube] ⏭️ All videos for ${selectedChannel.name} are duplicates. Trying next channel...`);
        }

        if (!targetVideo) {
            return NextResponse.json({
                success: true,
                message: "Tested multiple channels but all recent videos are duplicates",
                debug: { checkedVideos: checkedVideosLog }
            });
        }

        console.log(`[YouTube] ✅ Final Selection: "${targetVideo.title}" (${targetVideo.id}) from ${selectedChannel.name}`);

        console.log(`[YouTube] ✅ Selected Video: "${targetVideo.title}" (${targetVideo.id})`);

        // 4. Generate Content
        let { title, content, slug, unsplashKeyword } = await generateFromVideo(targetVideo);

        // 5. Image & Category Setup
        let featuredImageHtml = "";
        let featuredMediaId = 0;
        let imageUrl = "";
        let imageCredit = "Source: Unsplash";

        // 항상 Unsplash에서 이미지를 가져옵니다. (유튜브 원본 썸네일 포기)
        console.log(`[YouTube] 🖼️ Searching Unsplash thumbnail for keyword: "${unsplashKeyword}"`);
        try {
            const unsplashImg = await getFeaturedImage(unsplashKeyword);
            if (unsplashImg) {
                imageUrl = unsplashImg.url;
                imageCredit = unsplashImg.credit;
                console.log(`[YouTube] 🖼️ Found Unsplash Image: ${imageUrl}`);
            } else {
                throw new Error("No Unsplash image returned");
            }
        } catch (ue) {
            console.warn(`[YouTube] Failed to find Unsplash image for "${unsplashKeyword}", using random tech fallback.`);
            const fallbacks = [
                "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200",
                "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200",
                "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1200",
                "https://images.unsplash.com/photo-1531297461136-82lw8fca8b66?auto=format&fit=crop&q=80&w=1200"
            ];
            imageUrl = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }

        let uploaded = await uploadImageFromUrl(imageUrl, title, WP_AUTH);

        if (uploaded) {
            featuredMediaId = uploaded.id;

            // Only add the HTML block if upload succeeded, and use the original URL or source URL
            featuredImageHtml = `
            <figure class="wp-block-image size-large">
                <img src="${uploaded.source_url || imageUrl}" alt="${title}" style="border-radius:12px; box-shadow:0 8px 30px rgba(0,0,0,0.12); width:100%; height:auto;" />
                <figcaption style="text-align:center; font-size:14px; color:#888; margin-top:8px;">${imageCredit}</figcaption>
            </figure>`;
        }

        // Add featured image to content
        const finalContent = featuredImageHtml + content;

        // Category
        let categoryId = classifyContent(title, content);

        // Tags
        const tagsToSave: number[] = [];
        const ytTag = await getOrCreateTag("YouTube", WP_AUTH);
        if (ytTag) tagsToSave.push(ytTag);

        const chTag = await getOrCreateTag(selectedChannel.name, WP_AUTH);
        if (chTag) tagsToSave.push(chTag);

        const post = await createPostWithIndexing(
            {
                title,
                content: finalContent + `\n<!-- automation_source_id: youtube_${targetVideo.id} -->`,
                status: 'publish',
                categories: [categoryId],
                tags: tagsToSave,
                featured_media: featuredMediaId > 0 ? featuredMediaId : undefined,
                slug: slug || undefined,
                meta: {
                    automation_source_id: `youtube_${targetVideo.id}`,
                    youtube_source_id: targetVideo.id,
                    youtube_channel: selectedChannel.name
                }
            },
            WP_AUTH
        );

        if (!post) throw new Error("Failed to create post");

        console.log(`[YouTube] 🚀 Published post ID: ${post.id}`);

        // Google Indexing API handled automatically in createPostWithIndexing
        // We just calculate publicUrl for notification

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semicolonittech.com";
        // WP API returns slug in response, ensure interface has it or access simply
        const postAny = post as any;
        const postSlug = postAny.slug || (postAny.link || "").split("/").filter(Boolean).pop() || "";
        const publicUrl = `${siteUrl}/blog/${postSlug}`;

        // 구독자 알림 발송 (비동기)
        getVerifiedSubscribers().then(async (subscribers) => {
            if (subscribers.length > 0) {
                const excerptText = stripHtml(content).slice(0, 200) + "...";
                // slug is already derived
                await sendNewPostNotification(subscribers, {
                    title,
                    excerpt: excerptText,
                    url: publicUrl, // Use correct URL
                    imageUrl: imageUrl || undefined,
                });
                console.log(`[YouTube] 📧 Sent notification to ${subscribers.length} subscribers`);
            }
        }).catch(err => {
            console.error("[YouTube] Subscriber notification failed:", err);
        });

        return NextResponse.json({
            success: true,
            id: post.id,
            title: postAny.link,
            rotation: {
                previous: await getLastUsedChannelIndex(),
                current: selectedChannel.name
            }
        });

    } catch (error) {
        console.error("[YouTube] Error:", error);
        const message = error instanceof Error ? error.message : String(error);
        const lowerMsg = message.toLowerCase();
        const isTemporaryOrExternal = lowerMsg.includes("503") || lowerMsg.includes("429") || lowerMsg.includes("fetch failed") || lowerMsg.includes("tavily") || lowerMsg.includes("high demand") || lowerMsg.includes("service unavailable") || lowerMsg.includes("exceed");

        return NextResponse.json(
            { success: false, error: message },
            { status: isTemporaryOrExternal ? 200 : 500 }
        );
    }
}
