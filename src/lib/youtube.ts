/**
 * YouTube Data API v3 Integration
 * 관련 영상 검색 및 메타데이터 가져오기
 */

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

export interface YouTubeVideo {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    channelTitle: string;
    publishedAt: string;
    embedUrl: string;
    watchUrl: string;
}

/**
 * 키워드로 YouTube 영상 검색
 */
export async function searchYouTubeVideos(
    query: string,
    maxResults: number = 5
): Promise<YouTubeVideo[]> {
    if (!YOUTUBE_API_KEY) {
        console.log('[YouTube] API key not set');
        return [];
    }

    try {
        console.log(`[YouTube] Searching for: ${query}`);

        const params = new URLSearchParams({
            part: 'snippet',
            q: query,
            type: 'video',
            maxResults: maxResults.toString(),
            order: 'relevance',
            relevanceLanguage: 'ko',
            key: YOUTUBE_API_KEY,
        });

        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?${params}`
        );

        if (!response.ok) {
            const error = await response.json();
            console.error('[YouTube] API error:', error);
            return [];
        }

        const data = await response.json();

        const videos: YouTubeVideo[] = data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`,
            watchUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        }));

        console.log(`[YouTube] Found ${videos.length} videos`);
        return videos;

    } catch (error) {
        console.error('[YouTube] Error:', error);
        return [];
    }
}

/**
 * 영상 ID로 상세 정보 가져오기
 */
export async function getVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
    if (!YOUTUBE_API_KEY) {
        return null;
    }

    try {
        const params = new URLSearchParams({
            part: 'snippet',
            id: videoId,
            key: YOUTUBE_API_KEY,
        });

        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?${params}`
        );

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        const item = data.items?.[0];

        if (!item) {
            return null;
        }

        return {
            id: item.id,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            embedUrl: `https://www.youtube.com/embed/${item.id}`,
            watchUrl: `https://www.youtube.com/watch?v=${item.id}`,
        };

    } catch (error) {
        console.error('[YouTube] Error fetching video details:', error);
        return null;
    }
}

/**
 * YouTube URL에서 영상 ID 추출
 */
export function extractVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }

    return null;
}

/**
 * 블로그 글에 맞는 추천 영상 검색
 */
export async function getRecommendedVideos(
    topic: string,
    maxResults: number = 3
): Promise<YouTubeVideo[]> {
    // 검색어 최적화
    const searchQuery = `${topic} 리뷰 | 설명 | 튜토리얼`;
    return searchYouTubeVideos(searchQuery, maxResults);
}

/**
 * 추천 영상 HTML 생성
 */
export function generateRecommendedVideosHtml(videos: YouTubeVideo[]): string {
    if (videos.length === 0) {
        return '';
    }

    const videoCards = videos.map(video => `
        <div class="youtube-card" style="margin-bottom: 16px; padding: 16px; background: #f8f9fa; border-radius: 12px;">
            <a href="${video.watchUrl}" target="_blank" rel="noopener noreferrer" style="display: flex; gap: 16px; text-decoration: none; color: inherit;">
                <img src="${video.thumbnail}" alt="${video.title}" style="width: 160px; height: 90px; border-radius: 8px; object-fit: cover;" />
                <div>
                    <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #1a1a1a;">${video.title}</h4>
                    <p style="margin: 0; font-size: 12px; color: #666;">${video.channelTitle}</p>
                </div>
            </a>
        </div>
    `).join('');

    return `
        <div class="recommended-videos" style="margin-top: 32px; padding: 24px; background: #fff; border-radius: 16px; border: 1px solid #eee;">
            <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: bold;">🎬 추천 영상</h3>
            ${videoCards}
        </div>
    `;
}
