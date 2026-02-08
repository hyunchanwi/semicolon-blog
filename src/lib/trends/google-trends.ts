/**
 * Google Trends RSS Feed Integration
 * RSS 피드를 통한 트렌드 검색어 수집 (rate limit 회피)
 */

export interface TrendingTopic {
    title: string;
    traffic: string;
    relatedQueries: string[];
    category?: string;
    source?: string;
}

// Google Trends RSS URL (국가별)
const TRENDS_RSS_URL = 'https://trends.google.com/trending/rss?geo=';

/**
 * RSS 피드에서 트렌딩 검색어 가져오기
 */
export async function getTrendingFromRSS(geo: string = 'KR'): Promise<TrendingTopic[]> {
    try {
        console.log(`[Trends] Fetching trends from RSS for ${geo}...`);

        const response = await fetch(`${TRENDS_RSS_URL}${geo}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml',
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`RSS fetch failed: ${response.status}`);
        }

        const xml = await response.text();

        // Simple XML parsing for <item><title>
        const itemRegex = /<item>[\s\S]*?<title>([^<]+)<\/title>[\s\S]*?<\/item>/g;
        const trafficRegex = /<ht:approx_traffic>([^<]+)<\/ht:approx_traffic>/g;

        const topics: TrendingTopic[] = [];
        let match;

        while ((match = itemRegex.exec(xml)) !== null) {
            const title = match[1].trim();
            if (title && !title.startsWith('Daily Search')) {
                topics.push({
                    title: title,
                    traffic: '10K+',
                    relatedQueries: [],
                    source: 'google-rss'
                });
            }
        }

        console.log(`[Trends] Found ${topics.length} topics from RSS`);
        return topics;

    } catch (error) {
        console.error('[Trends] RSS fetch error:', error);
        return [];
    }
}

// IT 고정 주제 풀 (항상 IT 보장)
const IT_TOPIC_POOL = [
    // AI (최우선)
    "ChatGPT 최신 업데이트", "Claude AI 신기능",
    "Gemini AI 사용법", "AI 생산성 도구 비교",
    "AI 코딩 어시스턴트", "생성형 AI 트렌드",

    // 스마트폰
    "갤럭시 S 시리즈 비교", "아이폰 16 루머",
    "폴더블폰 시장 분석", "스마트폰 카메라 기술",
    "갤럭시 Z 폴드", "아이폰 vs 갤럭시",

    // 게임/콘솔
    "닌텐도 Switch 2 예상", "PS5 Pro 소식",
    "스팀 게임 추천", "모바일 게임 트렌드",
    "게이밍 PC 조립 가이드", "클라우드 게이밍",

    // 소프트웨어
    "윈도우 11 팁", "macOS 숨은 기능",
    "생산성 앱 추천", "개발자 도구 비교",
    "iOS 업데이트 기능", "안드로이드 최신 버전",

    // 하드웨어
    "그래픽카드 비교", "노트북 추천 2026",
    "모니터 구매 가이드", "기계식 키보드 추천",
];

/**
 * IT 고정 주제에서 랜덤 선택
 */
export function getRandomITTopic(): TrendingTopic {
    const randomTopic = IT_TOPIC_POOL[Math.floor(Math.random() * IT_TOPIC_POOL.length)];
    return {
        title: randomTopic,
        traffic: 'Curated',
        relatedQueries: [],
        source: 'it-pool',
        category: 'tech'
    };
}

/**
 * 테크 뉴스 RSS에서 트렌드 가져오기 (한국 테크 뉴스 추가)
 */
export async function getTechNewsFromRSS(): Promise<TrendingTopic[]> {
    const rssFeeds = [
        // 한국 테크 뉴스 (우선순위 높음)
        { url: 'https://www.bloter.net/feed', name: 'Bloter', priority: 1 },
        { url: 'https://zdnet.co.kr/rss/all_news.xml', name: 'ZDNet Korea', priority: 1 },
        // 글로벌 테크 뉴스
        { url: 'https://feeds.feedburner.com/TechCrunch/', name: 'TechCrunch', priority: 2 },
        { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge', priority: 2 },
    ];

    const allTopics: TrendingTopic[] = [];

    // 우선순위 순으로 정렬
    const sortedFeeds = rssFeeds.sort((a, b) => a.priority - b.priority);

    for (const feed of sortedFeeds) {
        try {
            const response = await fetch(feed.url, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                cache: 'no-store'
            });

            if (!response.ok) continue;

            const xml = await response.text();
            const titleRegex = /<title[^>]*>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/title>/g;

            let match;
            let count = 0;

            while ((match = titleRegex.exec(xml)) !== null && count < 5) {
                const title = match[1].trim();
                if (title && title.length > 10 && !title.includes(feed.name)) {
                    allTopics.push({
                        title: title,
                        traffic: 'News',
                        relatedQueries: [],
                        source: feed.name,
                        category: 'tech'
                    });
                    count++;
                }
            }
            console.log(`[Trends] Got ${count} topics from ${feed.name}`);
        } catch (error) {
            console.log(`[Trends] Failed to fetch ${feed.name}:`, error);
        }
    }

    return allTopics;
}

/**
 * 테크 관련 키워드 필터링 (더 정밀하게)
 */
export function filterTechTopics(topics: TrendingTopic[]): TrendingTopic[] {
    // IT/테크 관련 키워드
    const techKeywords = [
        // AI
        'ai', 'gpt', 'chatgpt', '인공지능', '로봇', 'openai', 'gemini', 'claude', 'llm', '딥러닝', 'machine learning',
        // 기기
        'iphone', 'galaxy s', '갤럭시 s', '갤럭시s', '아이폰', 'pixel', 'fold', '폴드', 'flip', '플립',
        'macbook', '맥북', 'ipad', '아이패드', 'airpods', '에어팟', 'watch', '워치',
        // 게임/콘솔
        'ps5', 'playstation', 'xbox', '닌텐도', 'nintendo', 'switch', 'steam', 'gaming', '게이밍',
        // 반도체/하드웨어
        'nvidia', 'amd', 'intel', 'cpu', 'gpu', '그래픽카드', 'rtx', 'chip', '반도체', 'snapdragon', 'exynos',
        // 자동차 테크
        '테슬라', 'tesla', '전기차', 'ev', '자율주행', 'waymo', 'fsd',
        // 소프트웨어
        'software', '소프트웨어', 'app', '앱스토어', 'update', '업데이트', 'ios', 'android', '안드로이드', 'windows',
        // 보안
        '보안', 'security', '해킹', 'hacking', '개인정보', 'privacy', 'hack', 'malware', '랜섬웨어',
        // 클라우드
        '클라우드', 'cloud', 'aws', 'azure', 'gcp',
        // 메타/VR
        'meta quest', 'vr', 'ar', '메타버스', 'metaverse', 'vision pro',
        // 빅테크
        'google', 'microsoft', 'amazon', 'apple', 'meta',
        // 스타트업/테크 일반
        'startup', '스타트업', 'tech', '테크', '디지털', 'digital', '5g', '6g', 'wi-fi',
    ];

    // 제외 키워드 (IT 아님 - 대폭 확장)
    const excludeKeywords = [
        // 금융/투자/경제
        '생명', '보험', '증권', '금융', '은행', '주가', '배당', '주식', '펀드', '코스피', '코스닥', '나스닥',
        '비트코인', 'bitcoin', '이더리움', '리플', '코인', '가상화폐', '투자', '매매', '시세', '전망', '경제', '금리', '환율',

        // 의료/바이오/건설
        '화재', '의료', '병원', '제약', '바이오', '건설', '부동산', '아파트', '청약', '전세', '월세',

        // 식품/화학/에너지
        '식품', '음료', '물산', '상사', '화학', '석유', '정유', '에너지', '가스',

        // 패션/뷰티/연예/스포츠
        '패션', '의류', '뷰티', '화장품', '스킨케어', '근육통', '엔터', '연예',
        '스포츠', '축구', '야구', '농구', '크리켓', '리그', '선수', '감독',

        // 피트니스/헬스 (새로 추가)
        '피트니스', 'fitness', 'gym', 'crunch', 'workout', '헬스', '운동', '다이어트',

        // 날씨 (새로 추가)
        '날씨', 'weather', '한파', '황사', '폭우', '태풍', '폭설', '미세먼지',

        // 비즈니스/자기계발 (새로 추가)
        '리더십', 'leadership', '경영', 'management', '자기계발', '성공학', '동기부여',

        // 정치/사회 (대폭 강화)
        '국회', '의원', '정당', '투표', '선거', '대통령', '장관', '실장', '청와대', '국정',
        'congress', 'senate', 'election', 'vote', 'politics', 'government',
        '강훈식', '이재명', '윤석열', '한동훈', '다주택', '인사검증',

        // TV 뉴스 방송 (새로 추가)
        'MBC뉴스', 'KBS뉴스', 'SBS뉴스', 'JTBC뉴스', '뉴스데스크', '뉴스투데이',
        '풀영상', '뉴스특보', '오늘이뉴스', '이슈앤직격',
    ];

    return topics.filter(topic => {
        const titleLower = topic.title.toLowerCase();

        // 1. 제외 키워드가 있으면 건너뛰기
        if (excludeKeywords.some(ex => titleLower.includes(ex))) {
            return false;
        }

        // 2. IT 키워드가 있어야 함
        return techKeywords.some(keyword => titleLower.includes(keyword.toLowerCase()));
    });
}

/**
 * 최적의 블로그 주제 선택 (IT 전용)
 */
export async function selectBestTopic(
    geo: string = 'KR',
    recentTopics: string[] = []
): Promise<TrendingTopic | null> {
    try {
        // 1. Google Trends RSS에서 트렌드 가져오기
        let trends = await getTrendingFromRSS(geo);
        console.log(`[Trends] Got ${trends.length} topics from Google Trends`);

        // 2. 테크 관련 필터링 (필수!)
        let filtered = filterTechTopics(trends);
        console.log(`[Trends] ${filtered.length} IT-related topics after filtering`);

        // 3. IT 주제가 없으면 테크 뉴스 RSS에서 가져오기
        if (filtered.length === 0) {
            console.log('[Trends] No IT topics in trends, fetching from tech news...');
            const techNews = await getTechNewsFromRSS();
            filtered = techNews;
            console.log(`[Trends] Got ${filtered.length} topics from tech news`);
        }

        // 4. 여전히 없으면 IT 고정 주제 풀에서 선택 (항상 IT 보장)
        if (filtered.length === 0) {
            console.log('[Trends] No IT topics from any source, using IT topic pool');
            const poolTopic = getRandomITTopic();
            console.log(`[Trends] ✅ Using curated IT topic: ${poolTopic.title}`);
            return poolTopic;
        }

        // 5. 최근 주제 제외 (영어/한글 제목 모두 고려)
        // 핵심 키워드 추출 함수 (브랜드명, 기술 용어 등 번역되지 않는 단어)
        const extractKeyTerms = (text: string): string[] => {
            // 영어 단어만 추출 (3글자 이상) - 브랜드명, 기술용어는 보통 영어 그대로
            const englishWords = text.match(/[a-zA-Z]{3,}/g) || [];
            // 숫자 포함 단어 (버전명 등)
            const techTerms = text.match(/[a-zA-Z0-9]+/g) || [];
            return [...new Set([...englishWords, ...techTerms])].map(w => w.toLowerCase());
        };

        const notRecent = filtered.filter(topic => {
            const topicKeyTerms = extractKeyTerms(topic.title);

            return !recentTopics.some(recent => {
                const recentKeyTerms = extractKeyTerms(recent);
                const recentLower = recent.toLowerCase();
                const topicLower = topic.title.toLowerCase();

                // 방법 1: 기존 방식 (전체 포함 비교)
                if (recentLower.includes(topicLower) || topicLower.includes(recentLower)) {
                    return true;
                }

                // 방법 2: 핵심 키워드 3개 이상 일치 시 중복으로 판단
                const matchingTerms = topicKeyTerms.filter(term =>
                    recentKeyTerms.includes(term) || recentLower.includes(term)
                );
                if (matchingTerms.length >= 3) {
                    console.log(`[Trends] Duplicate detected: "${topic.title}" matches "${recent}" (terms: ${matchingTerms.join(', ')})`);
                    return true;
                }

                return false;
            });
        });

        // 6. 첫 번째 적합한 주제 선택
        const selected = notRecent[0] || filtered[0];

        console.log(`[Trends] ✅ Selected IT topic: ${selected.title}`);
        return selected;

    } catch (error) {
        console.error('[Trends] Error selecting topic:', error);
        return null;
    }
}
