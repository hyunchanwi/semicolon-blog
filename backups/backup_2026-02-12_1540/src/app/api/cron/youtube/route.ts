
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { getFeaturedImage } from "@/lib/images/unsplash";
import { uploadImageFromUrl, getOrCreateTag, checkAutomationDuplicate, checkPostExistsByTitle } from "@/lib/wp-server";
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

// Types
interface WPCreatedPost {
    id: number;
    link: string;
}

export const maxDuration = 60; // Allow 60 seconds for execution (Vercel Hobby limit)
export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET;
const WP_API_URL = process.env.WP_API_URL || "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

// Gemini로 블로그 글 생성
async function generateFromVideo(video: YouTubeVideo): Promise<{ title: string; content: string }> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    // video.id는 footer embed용으로만 사용하고, 프롬프트에는 포함하지 않음 (상단 오염 방지)
    const prompt = `현재 연도는 **2026년**입니다. 당신은 전문 IT 분석가로서 아래 정보를 바탕으로 최신 트렌드를 반영한 깊이 있는 블로그 포스팅을 작성해야 합니다.
${createVideoPrompt(video)}

## 작성 원칙 (매우 중요)
1. **분량**: 반드시 **공백 제외 3500자 이상** 작성하세요. 주제에 대해 아주 상세하고 심도 있게 다루어야 합니다. (매우 중요)
2. **최신성**: 반드시 **2026년의 시점**에서 작성하세요. 과거 연도(2023, 2024 등)가 언급되지 않도록 주의하고, 필요한 경우 "2026년 최신 리뷰", "2026년 현재 시장 상황" 등의 표현을 사용하세요.
3. **어조**: 전문 IT 칼럼니스트 또는 기술 분석가의 어조로 작성하세요. "~합니다", "~이다" 체를 혼용하되 전문성을 유지하세요.
4. **독자**: IT에 관심이 많은 일반인부터 전문가까지 아우를 수 있는 수준으로 작성하세요.

## 본문 구성 지침
- **제목**: SEO 최적화된 매력적이고 전문적인 한글 제목 (30자 이내).
- **서론**: 독자의 공감을 이끌어내고 주제의 시의성을 강조하며 시작 (300자 내외).
- **핵심 요약 (Key Highlights)**: 영상에서 가장 중요한 포인트 3~5가지를 불렛 포인트로 명확하게 정리 (섹션 별도 분리).
- **심층 분석 및 본문**: 3개 이상의 소제목(<h3>)으로 나누어 상세하게 작성. 각 섹션은 단순히 현상을 나열하는 것이 아니라 배경 지식, 기술적 의미, 시장 영향력 등을 풍부하게 담아야 함.
- **결론 및 시사점**: 전체 내용을 요약하고, 이 주제가 우리에게 주는 의미나 향후 전망을 전문적으로 서술 (명확한 결론 필수).

## 시각 자료 배치
- 글의 흐름에 따라 **[IMAGE: (관련 기술/기기 영어 검색어)]** 플레이스홀더를 적절히 삽입하세요.
- 최소 4개 이상의 이미지가 필요합니다.

## 금지 사항
- 유튜브, 유튜버 이름, 채널 언급 금지 (마치 직접 분석한 글처럼 작성).
- 영상 주소나 임베드 코드 본문 내 삽입 금지.
- "이 영상에서", "영상에 따르면" 등 출처를 밝히는 표현 자제.

## 출력 형식 (JSON Only)
{
  "title": "블로그 제목",
  "content": "HTML 코드 (<body> 내부 내용만. <h3>, <p>, <table>, <ul>, <li>, <strong>, [IMAGE: ...] 태그 사용)"
}
JSON 외에 어떤 텍스트도 포함하지 마세요.`;

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


        // 1. [IMAGE: ...] 플레이스홀더 처리 (병렬 처리로 속도 개선)
        const imageMatches = finalContent.match(/\[IMAGE: [^\]]+\]/g);

        if (imageMatches && imageMatches.length > 0) {
            const searcher = new TavilySearchProvider(process.env.TAVILY_API_KEY || "");

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
                    console.error(`[YouTube] Failed to replace image placeholder ${match}`, e);
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
            content: content + (meta.automation_source_id ? `\n<!-- automation_source_id: ${meta.automation_source_id} -->` : ""),
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

/**
 * Finds the index of the channel used in the last published YouTube post.
 * Uses Tags to identify the channel name.
 */
async function getLastUsedChannelIndex(): Promise<number> {
    try {
        const youTubeTagId = await getOrCreateTag("YouTube", WP_AUTH);
        if (!youTubeTagId) return -1;

        // Fetch latest post with YouTube tag
        const res = await fetch(`${WP_API_URL}/posts?tags=${youTubeTagId}&per_page=1&_embed`, {
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
            const tagsRes = await fetch(`${WP_API_URL}/tags?include=${lastPost.tags.join(',')}`, {
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
        const jitter = Math.floor(Math.random() * 5000);
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

            console.log(`[YouTube] 🔍 Checking top ${checkLimit} videos for duplicates...`);

            for (const v of candidateVideos) {
                const { exists, matchedPost } = await checkAutomationDuplicate(`youtube_${v.id}`, WP_AUTH);
                let titleExists = false;
                if (!exists) titleExists = await checkPostExistsByTitle(v.title, WP_AUTH);

                const isDuplicate = exists || titleExists;
                checkedVideosLog.push({
                    channel: selectedChannel.name,
                    id: v.id,
                    title: v.title,
                    isDuplicate,
                    reason: exists ? `ID Match (${matchedPost?.id})` : (titleExists ? "Title Match" : "None")
                });

                if (!isDuplicate) {
                    targetVideo = v;
                    break;
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
        const { title, content } = await generateFromVideo(targetVideo);

        // 4-1. Category
        let categoryId = classifyContent(title, content);
        // Manual override for hardware/PC
        if (title.includes("미니PC") || title.includes("미니 컴퓨터") || title.includes("조립컴") || title.includes("노트북")) {
            categoryId = 4; // Gadget
        }
        if (categoryId === 1) categoryId = 9; // Fallback from Other to Tech

        // 4-2. Image
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
            const uploaded = await uploadImageFromUrl(imageUrl, title, WP_AUTH);
            if (uploaded) featuredMediaId = uploaded.id;
        }

        const featuredImageHtml = `
            <figure class="wp-block-image size-large">
                <img src="${imageUrl}" alt="${title}"/>
                <figcaption>${imageCredit}</figcaption>
            </figure>
        `;

        // 4-3. Publish
        // Create Tags: YouTube, Channel Name
        const youTubeTagId = await getOrCreateTag("YouTube", WP_AUTH);
        const channelTagId = await getOrCreateTag(selectedChannel.name, WP_AUTH); // Save Channel Name as Tag!

        const tagsToSave = [];
        if (youTubeTagId) tagsToSave.push(youTubeTagId);
        if (channelTagId) tagsToSave.push(channelTagId);

        // [Race Condition Check] Final check right before publishing
        const { exists: finalExists } = await checkAutomationDuplicate(`youtube_${targetVideo.id}`, WP_AUTH);
        if (finalExists) {
            console.log(`[YouTube] 🛑 Duplicate detected in final check for ${targetVideo.id}. Skipping.`);
            return NextResponse.json({ success: true, message: "Duplicate detected in final check" });
        }

        const post = await publishPost(
            title,
            content,
            categoryId,
            featuredImageHtml,
            featuredMediaId,
            tagsToSave,
            {
                automation_source_id: `youtube_${targetVideo.id}`,
                youtube_source_id: targetVideo.id,
                youtube_channel: selectedChannel.name // Save for rotation logic
            }
        );

        console.log(`[YouTube] 🚀 Published post ID: ${post.id}`);

        // Google Indexing API 알림 (비동기로 실행하여 응답 지연 방지)
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semicolonittech.com";
        // WP API returns slug in response, ensure interface has it or access simply
        const postSlug = (post as any).slug || post.link.split("/").filter(Boolean).pop();
        const publicUrl = `${siteUrl}/blog/${postSlug}`;

        console.log(`[YouTube] 📡 Notifying Google Indexing for: ${publicUrl}`);
        googlePublishUrl(publicUrl).catch(err => {
            console.error("[YouTube] Google Indexing failed:", err);
        });

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
            title: post.link,
            rotation: {
                previous: await getLastUsedChannelIndex(),
                current: selectedChannel.name
            }
        });

    } catch (error) {
        console.error("[YouTube] Error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
