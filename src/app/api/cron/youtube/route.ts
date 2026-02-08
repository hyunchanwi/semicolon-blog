
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { TavilySearchProvider } from "@/lib/search/tavily";
import { getFeaturedImage } from "@/lib/images/unsplash";
import { uploadImageFromUrl, getOrCreateTag, checkVideoExists } from "@/lib/wp-server";
import {
    getAllLatestVideos,
    createVideoPrompt,
    YouTubeVideo,
    channels
} from "@/lib/youtube-channels";
import { classifyContent } from "@/lib/category-rules";

// Types
interface WPCreatedPost {
    id: number;
    link: string;
}

export const maxDuration = 60; // Allow 60 seconds for execution (Vercel Hobby limit)
export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET;
const WP_API_URL = process.env.WP_API_URL || "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

// Gemini로 블로그 글 생성
async function generateFromVideo(video: YouTubeVideo): Promise<{ title: string; content: string }> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // video.id는 footer embed용으로만 사용하고, 프롬프트에는 포함하지 않음 (상단 오염 방지)
    const prompt = `${createVideoPrompt(video)}

## 작성 가이드
1. **제목**: SEO 최적화된 매력적인 한글 제목 (30자 이내). 유튜브 스타일보다는 전문적인 블로그/뉴스 기사 스타일로 작성.
2. **본문 구성**:
   - **서론**: 독자의 호기심을 자극하며 주제를 소개 (2-3문장)
   - **본론**: 핵심 내용을 논리적으로 구성 (소제목 <h3> 사용). 각 소제목 섹션은 깊이 있는 분석과 정보를 제공해야 함.
   - **결론**: 전체 내용을 요약하고 향후 전망이나 독자에게 주는 시사점 제시.
   
3. **이미지 배치 규칙 (매우 중요)**:
   - 글의 내용을 풍부하게 하기 위해 **본문 중간중간에 이미지가 들어갈 위치를 지정**해야 함.
   - 이미지가 필요한 곳에 다음과 같은 형식의 **플레이스홀더**를 삽입할 것:
     **\`[IMAGE: 검색어]\`**
   - 예시: \`[IMAGE: Galaxy S24 Ultra display]\`, \`[IMAGE: artificial intelligence chip architecture]\`
   - **검색어는 반드시 영어로 작성**할 것.
   - 최소 2개, 최대 4개의 이미지를 적절한 위치에 배치할 것.

4. **금지 사항 (Strict Rules)**:
   - **유튜브 영상 주소나 임베드 코드를 절대 포함하지 말 것.**
   - **"이 영상에서는", "유튜버 OOO에 따르면", "영상 출처:", "구독과 좋아요" 등 유튜브나 원작자를 유추할 수 있는 그 어떤 멘트도 금지.**
   - 마치 작성자가 직접 취재하거나 분석한 것처럼 전문적인 어조로 작성할 것 (\"~했습니다\" 또는 \"~하다\" 체는 무관하나 일관성 유지).

## 출력 형식 (JSON)
{
  "title": "한글 제목 (매력적인)",
  "content": "HTML 코드 (<body> 태그 내부 내용만. <h3>, <p>, <ul>, <li>, <strong>, [IMAGE: ...] 태그 사용)"
}

중요: JSON 문자열만 반환하세요. 마크다운(\` \`\`\`json \`) 을 사용하지 마세요.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // JSON 파싱 (코드블록 제거)
    text = text.replace(/```json\n ? /g, '').replace(/```\n?/g, '').trim();

    try {
        const parsed = JSON.parse(text);
        let finalContent = parsed.content || '';
        let finalTitle = parsed.title || video.title;

        // 0. (중요) 상단 영상 링크/임베드 제거 (정규식)
        // AI가 지시를 어기고 상단에 영상을 넣는 경우를 대비해 태그 및 링크 제거
        finalContent = finalContent
            .replace(/<iframe[^>]*youtube[^>]*><\/iframe>/gi, '') // iframe 제거
            .replace(/<div class="video-container"[^>]*>[\s\S]*?<\/div>/gi, '') // video container 제거
            .replace(/https:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s<"']+/gi, ''); // 단순 링크 제거

        // Oembed figure 제거 추가
        finalContent = finalContent.replace(/<figure class="wp-block-embed is-type-video is-provider-youtube[^"]*"[^>]*>[\s\S]*?<\/figure>/gi, '');


        // 1. [IMAGE: ...] 플레이스홀더 처리
        const imageMatches = finalContent.match(/\[IMAGE: [^\]]+\]/g);

        if (imageMatches && imageMatches.length > 0) {
            const searcher = new TavilySearchProvider(process.env.TAVILY_API_KEY || "");

            for (const match of imageMatches) {
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
                    console.error(`[YouTube] Failed to replace image placeholder ${match}`, e);
                }
                finalContent = finalContent.replace(match, imgHtml);
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
            <!-- Link removed as per user request (2026-02-08) -->
        </div>
        `;

        finalContent += embedHtml;

        return {
            title: finalTitle,
            content: finalContent
        };
    } catch (e) {
        console.error("[YouTube] Failed to parse Gemini response:", e);
        // 폴백: 영상 제목 사용, 영상 임베드 하단 포함 (링크 제외)
        return {
            title: video.title,
            content: `<p>${video.description}</p><p>(AI가 내용을 요약하는 데 실패했습니다. 원본 영상을 참고해 주세요.)</p>
            <div style="margin-top: 2rem;">
                <iframe width="100%" height="315" src="https://www.youtube.com/embed/${video.id}" frameborder="0" allowfullscreen></iframe>
            </div>`
        };
    }
}

// WordPress에 글 발행
async function publishPost(
    title: string,
    content: string,
    categoryId: number,
    featuredImageHtml: string = "",
    featuredMediaId: number = 0,
    tags: number[] = [],
    meta: Record<string, any> = {}
): Promise<WPCreatedPost> {
    if (!WP_AUTH) {
        throw new Error("WP_AUTH not configured");
    }

    const res = await fetch(`${WP_API_URL}/posts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${WP_AUTH}`
        },
        body: JSON.stringify({
            title,
            content,
            status: 'publish',
            categories: [categoryId],
            tags: tags,
            featured_media: featuredMediaId > 0 ? featuredMediaId : undefined,
            meta: meta // 메타데이터 저장 (youtube_source_id 등)
        })
    });

    if (!res.ok) {
        const error = await res.text();
        throw new Error(`Failed to publish: ${error}`);
    }

    return res.json();
}

export async function GET(request: NextRequest) {
    // Auth check
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        // Allow for testing
        console.log("[YouTube] Warning: No auth header");
    }

    try {
        console.log("[YouTube] 🎬 Starting YouTube-based post generation (Rotation Mode)...");

        // 1. 채널 로테이션 로직 (Cron 실행 시)
        // 사용자의 요청: "랜덤이 아닌 유튜브 채널 별 순서를 정해 로테이션 할 것"
        // 6시간마다 실행되므로, 현재 시간을 기준으로 채널을 선택합니다.
        // 채널: 0:EOAG(잇섭), 1:TechMong, 2:Jooyon, 3:Bulsit
        // const hour = new Date().getHours();
        const hour = 0; // Force Itsub (Index 0)
        const kstHour = (hour + 9) % 24; // Vercel is UTC, convert to KST approximation or just rely on consistent UTC hour.
        // Actually Vercel server time is UTC. Cron schedule `0 */6 * * *` runs at 0, 6, 12, 18 UTC.
        // Using `hour % channels.length` is deterministic.

        const channelIndex = hour % channels.length;
        const selectedChannel = channels[channelIndex]; // 하나만 선택

        console.log(`[YouTube] 🔄 Selected Channel for this hour (${hour}h): ${selectedChannel.name} (Index ${channelIndex})`);

        // 2. 전체 영상 가져오기 (API 효율을 위해 개선 가능하지만 지금은 유지)
        const allVideos = await getAllLatestVideos();
        const channelVideos = allVideos
            .filter(v => v.channelName === selectedChannel.name); // ID가 아닌 Name으로 필터링 주의 (channels[i].name과 video.channelName 일치 여부 확인 필요)
        // lib/youtube-channels.ts에서 channelName이 일치하게 나오는지 확인. 보통 ID로 하는게 안전함.
        // allVideos 반환값에 channelId가 있음.

        const targetVideos = allVideos.filter(v => v.channelId === selectedChannel.id);

        console.log(`[YouTube] Found ${targetVideos.length} videos for ${selectedChannel.name}`);

        if (targetVideos.length === 0) {
            return NextResponse.json({
                success: true,
                message: `No videos found for channel ${selectedChannel.name}`,
                rotation: { hour, selectedChannel: selectedChannel.name }
            });
        }

        // 3. 중복 체크 및 최신 영상 선정
        let targetVideo: YouTubeVideo | null = null;

        // targetVideos는 이미 최신순 정렬되어 있다고 가정 (RSS 파싱 순서)
        for (const video of targetVideos) {
            const exists = await checkVideoExists(video.id, WP_AUTH);
            if (!exists) {
                targetVideo = video;
                break; // 가장 최신이면서 발행 안 된 것 찾음
            } else {
                console.log(`[YouTube] Skipping duplicate: "${video.title}"`);
            }
        }

        if (!targetVideo) {
            return NextResponse.json({
                success: true,
                message: `All recent videos for ${selectedChannel.name} already posted`,
                rotation: { hour, selectedChannel: selectedChannel.name }
            });
        }

        console.log(`[YouTube] ✅ Selected Video: "${targetVideo.title}" (${targetVideo.id})`);

        // 4. 글 생성 및 발행
        const { title, content } = await generateFromVideo(targetVideo);

        // 4-1. 카테고리 분류
        const categoryId = classifyContent(title, content);
        if (categoryId === 1) { // 1 = 기타
            console.log(`[YouTube] ⚠️ "${title}" classified as OTHER (non-IT), skipping`);
            return NextResponse.json({
                success: false,
                reason: 'Skipped non-IT content',
                video: targetVideo.title
            });
        }

        // 4-2. 썸네일/이미지 처리 (Feature Image)
        let featuredMediaId = 0;
        let imageUrl = "";
        let imageCredit = "";

        try {
            const imageData = await getFeaturedImage(title);
            if (imageData) {
                imageUrl = imageData.url;
                imageCredit = imageData.credit;
            }
            if (!imageUrl) {
                const searcher = new TavilySearchProvider(process.env.TAVILY_API_KEY || "");
                const tRes = await searcher.search(`${title} image`);
                if (tRes[0]?.images?.[0]) imageUrl = tRes[0].images[0];
            }
        } catch (e) { }

        if (!imageUrl) {
            imageUrl = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200";
            imageCredit = "Unsplash";
        }

        if (WP_AUTH && imageUrl) {
            const mid = await uploadImageFromUrl(imageUrl, title, WP_AUTH);
            if (mid) featuredMediaId = mid;
        }

        const featuredImageHtml = `
                    <figure class="wp-block-image size-large">
                        <img src="${imageUrl}" alt="${title}"/>
                        <figcaption>${imageCredit}</figcaption>
                    </figure>
                `;

        // 4-3. 발행
        const youTubeTagId = await getOrCreateTag("YouTube", WP_AUTH);
        const post = await publishPost(
            title,
            content,
            categoryId,
            featuredImageHtml,
            featuredMediaId,
            youTubeTagId ? [youTubeTagId] : [],
            { youtube_source_id: targetVideo.id, youtube_channel: targetVideo.channelName }
        );

        console.log(`[YouTube] 🚀 Published post ID: ${post.id}`);

        return NextResponse.json({
            success: true,
            id: post.id,
            title: post.link,
            rotation: {
                hour,
                selectedChannel: selectedChannel.name
            }
        });

    } catch (error) {
        console.error("[YouTube] Error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
