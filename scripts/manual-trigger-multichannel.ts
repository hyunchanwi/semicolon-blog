
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { TavilySearchProvider } from "../src/lib/search/tavily";
import { getFeaturedImage } from "../src/lib/images/unsplash";
import { uploadImageFromUrl, getOrCreateTag, checkVideoExists } from "../src/lib/wp-server";
import {
    getAllLatestVideos,
    createVideoPrompt,
    YouTubeVideo
} from "../src/lib/youtube-channels";
import { classifyContent } from "../src/lib/category-rules";

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.production') }); // For WP_AUTH

const WP_API_URL = process.env.WP_API_URL || "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

if (!WP_AUTH) {
    console.error("❌ WP_AUTH not found.");
    process.exit(1);
}

// Reuse generateFromVideo (modified to REMOVE link as per new rule)
async function generateFromVideo(video: YouTubeVideo): Promise<{ title: string; content: string }> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `${createVideoPrompt(video)}

## 작성 가이드
1. **제목**: SEO 최적화된 매력적인 한글 제목 (30자 이내). 유튜브 스타일보다는 전문적인 블로그/뉴스 기사 스타일로 작성.
2. **본문 구성**:
   - **서론**: 독자의 호기심을 자극하며 주제를 소개 (2-3문장)
   - **본론**: 핵심 내용을 논리적으로 구성 (소제목 <h3> 사용). 각 소제목 섹션은 깊이 있는 분석과 정보를 제공해야 함.
   - **결론**: 전체 내용을 요약하고 향후 전망이나 독자에게 주는 시사점 제시.
   
3. **이미지 배치 규칙 (매우 중요)**:
   - 본문 중간중간에 이미지가 들어갈 위치를 지정해야 함.
   - **\`[IMAGE: 검색어]\`** 형식의 플레이스홀더 삽입.
   - 검색어는 반드시 영어로 작성.
   - 최소 2개, 최대 4개.

4. **금지 사항 (Strict Rules)**:
   - **유튜브 영상 주소나 임베드 코드를 절대 포함하지 말 것.**
   - **"이 영상에서는", "구독과 좋아요" 등 유튜브 관련 멘트 금지.**
   
## 출력 형식 (JSON)
{
  "title": "제목",
  "content": "HTML 코드 (<body> 태그 내부 내용만)"
}
JSON 문자열만 반환하세요.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    text = text.replace(/```json\n ? /g, '').replace(/```\n?/g, '').trim();

    try {
        const parsed = JSON.parse(text);
        let finalContent = parsed.content || '';
        let finalTitle = parsed.title || video.title;

        // 0. 상단 영상 링크/임베드 제거
        finalContent = finalContent
            .replace(/<iframe[^>]*youtube[^>]*><\/iframe>/gi, '')
            .replace(/<div class="video-container"[^>]*>[\s\S]*?<\/div>/gi, '')
            .replace(/https:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s<"']+/gi, '');

        // 1. 이미지 처리
        const imageMatches = finalContent.match(/\[IMAGE: [^\]]+\]/g);
        if (imageMatches && imageMatches.length > 0) {
            const searcher = new TavilySearchProvider(process.env.TAVILY_API_KEY || "");
            for (const match of imageMatches) {
                const query = match.replace('[IMAGE: ', '').replace(']', '').trim();
                let imgHtml = '';
                try {
                    console.log(`Searching image for: "${query}"`);
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
                } catch (e) { console.error(e); }
                finalContent = finalContent.replace(match, imgHtml);
            }
        }

        // 2. 영상 임베드 추가 (하단) - LINK REMOVED
        const embedHtml = `
        <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e2e8f0;">
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem;">📺 참고 영상</h3>
            <div class="video-container" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:0.75rem;box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1);">
                <iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://www.youtube.com/embed/${video.id}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
            <!-- Link removed as per user request -->
        </div>
        `;
        finalContent += embedHtml;

        return { title: finalTitle, content: finalContent };
    } catch (e) {
        console.error("Failed to parse Gemini response:", e);
        return {
            title: video.title,
            content: `<p>${video.description}</p><p>(AI 요약 실패)</p>
            <div style="margin-top: 2rem;">
                <iframe width="100%" height="315" src="https://www.youtube.com/embed/${video.id}" frameborder="0" allowfullscreen></iframe>
            </div>`
        };
    }
}

async function publishPost(
    title: string,
    content: string,
    categoryId: number,
    featuredImageHtml: string = "",
    featuredMediaId: number = 0,
    tags: number[] = [],
    meta: Record<string, any> = {}
) {
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
            meta: meta
        })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

async function run() {
    console.log("🎬 Starting Manual Multi-Channel Trigger...");

    // 1. 모든 채널 영상 가져오기
    const allVideos = await getAllLatestVideos();
    console.log(`Got ${allVideos.length} videos total.`);

    // 2. 채널별 그룹화
    const videosByChannel = new Map<string, YouTubeVideo[]>();
    for (const video of allVideos) {
        if (!videosByChannel.has(video.channelName)) {
            videosByChannel.set(video.channelName, []);
        }
        videosByChannel.get(video.channelName)?.push(video);
    }

    const videosToProcess: YouTubeVideo[] = [];

    // 3. 각 채널별 최신 1개 선정 (중복 체크)
    for (const [channelName, videos] of videosByChannel) {
        let targetVideo: YouTubeVideo | null = null;
        for (const video of videos) {
            const exists = await checkVideoExists(video.id, WP_AUTH);
            if (!exists) {
                targetVideo = video;
                break;
            } else {
                console.log(`Skipping duplicate: ${video.title}`);
            }
        }
        if (targetVideo) {
            console.log(`✅ Selected for ${channelName}: ${targetVideo.title}`);
            videosToProcess.push(targetVideo);
        }
    }

    if (videosToProcess.length === 0) {
        console.log("No new videos to process.");
        return;
    }

    console.log(`Processing ${videosToProcess.length} videos...`);

    // 4. 병렬 처리
    const results = await Promise.allSettled(videosToProcess.map(async (video) => {
        try {
            console.log(`Generating: ${video.title}...`);
            const { title, content } = await generateFromVideo(video);

            const categoryId = classifyContent(title, content);
            if (categoryId === 1) {
                console.log(`Skipping non-IT: ${title}`);
                return;
            }

            // Image logic (simplified)
            let featuredMediaId = 0;
            let imageUrl = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200";
            let imageCredit = "Unsplash";

            try {
                const imageData = await getFeaturedImage(title);
                if (imageData) {
                    imageUrl = imageData.url;
                    imageCredit = imageData.credit;
                } else {
                    const searcher = new TavilySearchProvider(process.env.TAVILY_API_KEY || "");
                    const tRes = await searcher.search(`${title} image`);
                    if (tRes[0]?.images?.[0]) imageUrl = tRes[0].images[0];
                }
            } catch (e) { }

            if (WP_AUTH && imageUrl) {
                const mid = await uploadImageFromUrl(imageUrl, title, WP_AUTH);
                if (mid) featuredMediaId = mid;
            }

            const imgHtml = `<figure class="wp-block-image size-large"><img src="${imageUrl}" alt="${title}"/><figcaption>${imageCredit}</figcaption></figure>`;

            const tagId = await getOrCreateTag("YouTube", WP_AUTH);
            const post = await publishPost(title, content, categoryId, imgHtml, featuredMediaId, tagId ? [tagId] : [], { youtube_source_id: video.id, youtube_channel: video.channelName });

            console.log(`🚀 Published: ${title} (ID: ${post.id})`);
            return post.id;
        } catch (e) {
            console.error(`Error processing ${video.title}:`, e);
            throw e;
        }
    }));

    console.log("Done.");
}

run();
