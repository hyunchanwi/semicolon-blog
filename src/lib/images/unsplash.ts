/**
 * Unsplash API Integration
 * 무료 고품질 이미지 검색 (출처 명시 포함)
 */

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '';

export interface UnsplashImage {
    url: string;
    thumbnailUrl: string;
    author: string;
    authorUrl: string;
    description: string;
    downloadUrl: string;
}

/**
 * 키워드로 Unsplash 이미지 검색
 */
export async function searchUnsplashImages(
    query: string,
    count: number = 1
): Promise<UnsplashImage[]> {
    if (!UNSPLASH_ACCESS_KEY) {
        console.log('[Unsplash] API key not set, using fallback');
        return [];
    }

    try {
        // 한글 키워드를 영어로 변환 (간단 매핑)
        const translatedQuery = translateKeyword(query);

        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(translatedQuery)}&per_page=${count}&orientation=landscape`,
            {
                headers: {
                    'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                },
            }
        );

        if (!response.ok) {
            console.error('[Unsplash] API error:', response.status);
            return [];
        }

        const data = await response.json();

        return data.results.map((photo: any) => ({
            url: photo.urls.regular,
            thumbnailUrl: photo.urls.small,
            author: photo.user.name,
            authorUrl: photo.user.links.html,
            description: photo.description || photo.alt_description || query,
            downloadUrl: photo.links.download_location,
        }));

    } catch (error) {
        console.error('[Unsplash] Error:', error);
        return [];
    }
}

/**
 * 한글 키워드 영어 변환 (자주 쓰는 키워드)
 */
function translateKeyword(keyword: string): string {
    const translations: Record<string, string> = {
        '인공지능': 'artificial intelligence',
        'AI': 'artificial intelligence technology',
        '스마트폰': 'smartphone',
        '갤럭시': 'samsung galaxy phone',
        '아이폰': 'iphone apple',
        '컴퓨터': 'computer technology',
        '노트북': 'laptop',
        '게임': 'gaming technology',
        '보안': 'cybersecurity',
        '클라우드': 'cloud computing',
        '로봇': 'robot technology',
        '전기차': 'electric car tesla',
        '자율주행': 'autonomous driving',
        '메타버스': 'metaverse virtual reality',
        '블록체인': 'blockchain cryptocurrency',
        '소프트웨어': 'software development',
        '앱': 'mobile app',
        '테크': 'technology',
        '기술': 'technology innovation',
    };

    // 키워드에서 번역 가능한 단어 찾기
    for (const [kr, en] of Object.entries(translations)) {
        if (keyword.toLowerCase().includes(kr.toLowerCase())) {
            return en;
        }
    }

    // 영어 키워드는 그대로 반환
    if (/^[a-zA-Z\s]+$/.test(keyword)) {
        return keyword;
    }

    // 기본 fallback
    return 'technology';
}

/**
 * 이미지 출처 HTML 생성
 */
export function getImageCredit(image: UnsplashImage): string {
    return `Photo by <a href="${image.authorUrl}?utm_source=semicolon&utm_medium=referral" target="_blank" rel="noopener">${image.author}</a> on <a href="https://unsplash.com/?utm_source=semicolon&utm_medium=referral" target="_blank" rel="noopener">Unsplash</a>`;
}

/**
 * 블로그 글에 사용할 대표 이미지 가져오기
 */
export async function getFeaturedImage(topic: string): Promise<{
    url: string;
    credit: string;
} | null> {
    const images = await searchUnsplashImages(topic, 1);

    if (images.length === 0) {
        return null;
    }

    const image = images[0];
    return {
        url: image.url,
        credit: getImageCredit(image),
    };
}
