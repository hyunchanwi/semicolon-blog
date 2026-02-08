/**
 * 유튜브 채널 연동 라이브러리
 * - 특정 테크 유튜버 채널의 최신 영상 가져오기
 * - 영상 정보를 블로그 글 주제로 변환
 */

// 테크 유튜버 채널 목록
// 테크 유튜버 채널 목록
export const TECH_CHANNELS = [
    {
        name: "잇섭",
        id: "UCdUcjkyZtf-1WJyPPiETF1g",
        category: "gadget",
        keywords: ["리뷰", "언박싱", "가젯"]
    },
    {
        name: "테크몽",
        id: "UCFX6adXoyQKxft933NB3rmA",
        category: "tech",
        keywords: ["테크", "IT", "기술"]
    },
    {
        name: "주연테크",
        id: "UC1YU436hXVXna8YuqQHCYKQ",
        category: "hardware",
        keywords: ["PC", "조립", "하드웨어"]
    },
    {
        name: "뻘짓연구소",
        id: "UCMYJw-gH6-_LNQzhqfYgDbg",
        category: "experiment",
        keywords: ["실험", "테스트", "리뷰"]
    }
];

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
        const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
            next: { revalidate: 3600 }
        });

        if (!response.ok) return [];

        const xml = await response.text();
        const channel = TECH_CHANNELS.find(c => c.id === channelId);

        // Simple XML Regex Parsing
        const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
        const videos: YouTubeVideo[] = [];

        let match;
        while ((match = entryRegex.exec(xml)) !== null) {
            const entry = match[1];
            const idMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
            const titleMatch = entry.match(/<title>(.*?)<\/title>/);
            const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
            const descMatch = entry.match(/<media:description[^>]*>([\s\S]*?)<\/media:description>/);
            const thumbMatch = entry.match(/<media:thumbnail url="(.*?)"/);

            if (idMatch && titleMatch) {
                videos.push({
                    id: idMatch[1],
                    title: titleMatch[1],
                    description: descMatch ? descMatch[1] : "",
                    channelName: channel?.name || "YouTube",
                    channelId: channelId,
                    publishedAt: publishedMatch ? publishedMatch[1] : new Date().toISOString(),
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
): Promise<YouTubeVideo[]> {
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

                        return videosData.items?.map((item: any) => ({
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
                    }
                }
            }
        } catch (error) {
            console.error("[YouTube-API] Error:", error);
        }
    }

    // 2. Fallback to RSS
    console.log(`[YouTube] Fallback to RSS for ${channelId}`);
    const rssVideos = await getVideosFromRSS(channelId);
    return rssVideos.slice(0, maxResults);
}

/**
 * 모든 테크 채널에서 최신 영상 가져오기
 */
export async function getAllLatestVideos(): Promise<YouTubeVideo[]> {
    const allVideos: YouTubeVideo[] = [];

    for (const channel of TECH_CHANNELS) {
        try {
            const videos = await getLatestVideos(channel.id, 3);
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

    // 1주일 이내 영상만 필터링 (User Requirement)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentVideos = allVideos.filter(v => new Date(v.publishedAt) >= oneWeekAgo);
    console.log(`[YouTube] Filtered for recency: ${allVideos.length} -> ${recentVideos.length} videos (within 7 days)`);

    return recentVideos;
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
- 설명: ${video.description.slice(0, 500)}

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
