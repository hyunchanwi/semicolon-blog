/**
 * 유튜브 채널 연동 라이브러리
 * - 특정 테크 유튜버 채널의 최신 영상 가져오기
 * - 영상 정보를 블로그 글 주제로 변환
 */

import { TavilySearchProvider } from "@/lib/search/tavily";

// 테크 유튜버 채널 목록
// 테크 유튜버 채널 목록
// 주의: 여기서 설정한 'keywords'와 'category'는 참고용 정보이며, 
// 실제 영상 수집(Filtering)이나 카테고리 분류(Classification)에는 직접적인 영향을 주지 않습니다.
// 모든 최신 영상을 수집한 후, 본문 내용을 분석하여 자동으로 카테고리를 판단합니다.
export const TECH_CHANNELS = [
    {
        name: "잇섭",
        id: "UCdUcjkyZtf-1WJyPPiETF1g",
        category: "gadget",
        keywords: ["리뷰", "언박싱", "가젯"] // Reference only
    },
    {
        name: "테크몽",
        id: "UCFX6adXoyQKxft933NB3rmA",
        category: "tech",
        keywords: ["테크", "IT", "기술"] // Reference only
    },
    {
        name: "주연",
        id: "UCB11SAf7WSN4GrCquKoOHrw",
        category: "gadget",
        keywords: ["전자기기", "리뷰", "라이프스타일"] // Reference only
    },
    {
        name: "뻘짓연구소",
        id: "UCMYJw-gH6-_LNQzhqfYgDbg",
        category: "experiment",
        keywords: ["실험", "테스트", "리뷰"] // Reference only
    }
];

/**
 * 유튜브 영상이 Short인지 판별하는 헬퍼 함수
 * HEAD 요청을 보내서 redirect(303) 되면 일반 영상, 200 OK면 쇼츠로 판별
 */
export async function isYouTubeShort(videoId: string): Promise<boolean> {
    try {
        const res = await fetch(`https://www.youtube.com/shorts/${videoId}`, {
            method: 'HEAD',
            redirect: 'manual'
        });
        return res.status === 200;
    } catch (e) {
        console.error(`[YouTube-ShortsCheck] Error checking ${videoId}:`, e);
        return false;
    }
}

export const channels = TECH_CHANNELS;

export interface YouTubeVideo {
    id: string;
    title: string;
    description: string;
    channelName: string;
    channelId: string;
    publishedAt: string;
    thumbnailUrl: string;
    category: string;
}

/**
 * RSS 피드에서 최신 영상 가져오기 (API Key 불필요)
 */
async function getVideosFromRSS(channelId: string): Promise<YouTubeVideo[]> {
    try {
        const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}&_t=${Date.now()}`, {
            cache: 'no-store',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });

        if (!response.ok) return [];

        const xml = await response.text();
        const channel = TECH_CHANNELS.find(c => c.id === channelId);

        // Simple XML Regex Parsing (Robust)
        const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/g;
        const videos: YouTubeVideo[] = [];

        let match;
        while ((match = entryRegex.exec(xml)) !== null) {
            const entry = match[1];

            // Regex using [\s\S]*? for newlines and [^>]*> for attributes
            const idMatch = entry.match(/<yt:videoId[^>]*>([\s\S]*?)<\/yt:videoId>/) || entry.match(/<id[^>]*>.*?yt:video:([\s\S]*?)<\/id>/);
            const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/);

            // Try published first, then updated
            const publishedMatch = entry.match(/<published[^>]*>([\s\S]*?)<\/published>/) || entry.match(/<updated[^>]*>([\s\S]*?)<\/updated>/);

            const descMatch = entry.match(/<media:description[^>]*>([\s\S]*?)<\/media:description>/);
            const thumbMatch = entry.match(/<media:thumbnail[^>]*url="([\s\S]*?)"/);

            // Use epoch if no date (fallback) to avoid false positive recency
            const publishDate = publishedMatch ? publishedMatch[1].trim() : new Date(0).toISOString();

            if (idMatch && titleMatch) {
                videos.push({
                    id: idMatch[1],
                    title: titleMatch[1],
                    description: descMatch ? descMatch[1] : "",
                    channelName: channel?.name || "YouTube", // Force channel name from config
                    channelId: channelId,
                    publishedAt: publishDate,
                    thumbnailUrl: thumbMatch ? thumbMatch[1] : `https://i.ytimg.com/vi/${idMatch[1]}/hqdefault.jpg`,
                    category: channel?.category || "tech"
                });
            }
        }

        return videos;
    } catch (e) {
        console.error(`[YouTube-RSS] Failed for ${channelId}:`, e);
        return [];
    }
}

/**
 * YouTube Data API로 채널의 최신 영상 가져오기 (RSS 폴백 포함)
 */
export async function getLatestVideos(
    channelId: string,
    maxResults: number = 5
): Promise<{ videos: YouTubeVideo[], debugInfo?: string }> {
    // ... (previous code) ... (I need to be careful with replace_file_content scope)

    // instead of replacing the whole function, I'll replace the return statement and interface if possible.
    // But function signature is at the top.

    // I will replace the logic block at the end of getLatestVideos first.

    const apiKey = process.env.YOUTUBE_API_KEY;

    // 1. Try API if Key exists
    if (apiKey) {
        try {
            const channelResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
            );

            if (channelResponse.ok) {
                const channelData = await channelResponse.json();
                const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

                if (uploadsPlaylistId) {
                    const videosResponse = await fetch(
                        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${apiKey}`
                    );

                    if (videosResponse.ok) {
                        const videosData = await videosResponse.json();
                        const channel = TECH_CHANNELS.find(c => c.id === channelId);

                        const apiVideos = videosData.items?.map((item: any) => ({
                            id: item.snippet.resourceId.videoId,
                            title: item.snippet.title,
                            description: item.snippet.description,
                            channelName: channel?.name || item.snippet.channelTitle,
                            channelId: channelId,
                            publishedAt: item.snippet.publishedAt,
                            thumbnailUrl: item.snippet.thumbnails?.maxres?.url ||
                                item.snippet.thumbnails?.high?.url ||
                                item.snippet.thumbnails?.medium?.url,
                            category: channel?.category || "tech"
                        })) || [];

                        // API 결과가 최신인지 확인 (7일 이내)
                        const oneWeekAgo = new Date();
                        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                        const hasRecentApiVideos = apiVideos.some((v: any) => new Date(v.publishedAt) >= oneWeekAgo);

                        if (hasRecentApiVideos) {
                            return {
                                videos: apiVideos,
                                debugInfo: "Source: YouTube API (Success)"
                            };
                        } else {
                            console.log(`[YouTube-API] API returned ${apiVideos.length} videos but none are recent. Falling back to RSS/Tavily.`);
                            // 리턴하지 않고 아래 RSS/Tavily 로직으로 진행
                        }
                    }
                }
            }
        } catch (error) {
            console.error("[YouTube-API] Error:", error);
        }
    }

    // 2. Fallback to RSS (if API fails or is not configured)
    const videos = await getVideosFromRSS(channelId);

    // We no longer use Tavily fallback here because searching YouTube by channel name
    // (e.g. "주연") causes massive false positives (like gaming videos) if the channel
    // hasn't uploaded anything recently. If the channel really has no recent videos,
    // the rotation logic in route.ts will automatically try the next channel.

    return { videos: videos.slice(0, maxResults) };
}

/**
 * 모든 테크 채널에서 최신 영상 가져오기
 * targetChannelName이 있으면 해당 채널만 가져옴 (Rotation용)
 */
export async function getAllLatestVideos(targetChannelName?: string): Promise<{ videos: YouTubeVideo[], debugXml?: string, debugInfo?: string }> {
    const allVideos: YouTubeVideo[] = [];
    let debugXml = "";
    let lastDebugInfo: string | undefined;

    // Filter channels if target is provided
    const channelsToFetch = targetChannelName
        ? TECH_CHANNELS.filter(c => c.name === targetChannelName)
        : TECH_CHANNELS;

    for (const channel of channelsToFetch) {
        try {
            // 주연테크(Index 2) 디버깅용 XML 캡처
            if (channel.name === "주연테크") {
                // getVideosFromRSS를 직접 호출해서 XML을 가져와야 함 (함수 분리 필요하지만 일단 여기서 처리)
                // getLatestVideos는 내부적으로 RSS를 호출하므로, 여기서 XML을 직접 가져올 순 없음.
                // 따라서 getVideosFromRSS 함수가 debug info를 리턴하도록 수정해야 함.
                // 임시로 직접 fetch
                const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}&_t=${Date.now()}`, { cache: 'no-store' });
                const xml = await res.text();
                debugXml = xml.substring(0, 2000); // 앞부분 2000자
            }

            const { videos, debugInfo } = await getLatestVideos(channel.id, 10);
            if (debugInfo) lastDebugInfo = debugInfo;

            allVideos.push(...videos);
            console.log(`[YouTube] Got ${videos.length} videos from ${channel.name}`);
        } catch (error) {
            console.error(`[YouTube] Failed to fetch from ${channel.name}:`, error);
        }
    }

    // 최신순 정렬
    allVideos.sort((a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // 2주 이내 영상 및 쇼츠(Shorts) 필터링
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14);

    const validVideos = [];
    for (const v of allVideos) {
        if (new Date(v.publishedAt) < cutoffDate) {
            continue;
        }

        const isShort = await isYouTubeShort(v.id);
        if (isShort) {
            console.log(`[YouTube] Filtered out ${v.id} (YouTube Short)`);
            continue;
        }

        validVideos.push(v);
    }

    console.log(`[YouTube] Filtered for recency & shorts: ${allVideos.length} -> ${validVideos.length} videos`);

    return { videos: validVideos, debugXml, debugInfo: lastDebugInfo };
}

/**
 * 중복 체크 - 이미 글이 있는 영상인지 확인
 */
export function isVideoAlreadyPosted(
    videoTitle: string,
    recentPosts: string[]
): boolean {
    const videoTitleLower = videoTitle.toLowerCase();

    return recentPosts.some(post => {
        const postLower = post.toLowerCase();

        // 1. 직접 포함 확인
        if (postLower.includes(videoTitleLower) || videoTitleLower.includes(postLower)) {
            return true;
        }

        // 2. 핵심 단어 비교 (3개 이상 일치 시 중복)
        const videoWords = videoTitleLower.split(/\s+/).filter(w => w.length > 2);
        const postWords = postLower.split(/\s+/).filter(w => w.length > 2);

        const matchingWords = videoWords.filter(w =>
            postWords.some(pw => pw.includes(w) || w.includes(pw))
        );

        return matchingWords.length >= 3;
    });
}

/**
 * 영상에서 블로그 글 주제 생성을 위한 프롬프트
 */
export function createVideoPrompt(video: YouTubeVideo): string {
    return `다음 유튜브 영상을 참고하여 IT/테크 블로그 글을 작성해주세요.

## 영상 정보
- 제목: ${video.title}
- 채널: ${video.channelName}
- 설명: ${video.description.slice(0, 2000)}

## 작성 가이드
1. **절대 규칙**: 반드시 제공된 [영상 정보]와 [설명] 내용만을 기반으로 작성하세요. 
2. **금지 사항**: 영상에 없는 내용, 특히 최근 뉴스, 정치, 사회 이슈 등을 절대 추가하지 마세요. MBC 뉴스나 타 언론사 내용을 가져오지 마세요.
3. 영상 내용을 기반으로 하되, 글만으로도 이해할 수 있게 풍부하게 작성
4. 제목은 SEO 최적화된 형태로
5. 서론, 본론(소제목 포함), 결론으로 구성

## 출처
> 이 글은 **${video.channelName}** 채널의 영상을 참고하여 작성되었습니다.`;
}

/**
 * 카테고리 ID 매핑 (유튜브 카테고리 → WordPress 카테고리)
 * 중앙 분류 규칙 사용
 */
export function getWordPressCategoryId(youtubeCategory: string): number {
    // 기본 유튜브 채널 카테고리 → WP 카테고리 매핑
    const categoryMap: Record<string, number> = {
        "gadget": 4,      // 가젯 (ID: 4)
        "tech": 9,        // 테크 (ID: 9)
        "hardware": 4,    // 하드웨어 → 가젯
        "experiment": 4,  // 실험 → 가젯
        "software": 8,    // 소프트웨어 (ID: 8)
        "ai": 15,         // AI (ID: 15)
        "apps": 2,        // 앱 (ID: 2)
    };

    return categoryMap[youtubeCategory] || 9; // 기본값: 테크 (ID: 9)
}

