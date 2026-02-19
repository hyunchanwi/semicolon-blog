/**
 * 기존 글 카테고리 재분류 스크립트 (최종 개선 버전)
 * 새로운 분류 규칙에 따라 모든 글을 재분류합니다.
 */

const WP_API_URL = "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

const CATEGORY_IDS = {
    GADGET: 4,
    TECH: 9,
    AI: 15,
    SOFTWARE: 8,
    APPS: 2,
    OTHER: 1,
};

// 분류 제외 키워드 (이 키워드가 포함되면 무조건 '기타'로 분류)
const NON_TECH_KEYWORDS = [
    // 정치/사회
    '상원', '하원', '의회', '국회', '예산', 'budget', 'congress', 'senate',
    '셧다운', 'shutdown', '선거', 'election', '투표', 'vote', '법안', 'bill',
    '정책', 'policy', '규제', 'regulation', '정부', 'government',
    '대통령', 'president', '총리', 'minister',

    // 경제/주식 (단, 일반적인 '전망', '투자'는 테크 기사에도 쓰이므로 제외)
    '주식', 'stock', '증시', 'market', '코스피', 'kospi', '나스닥', 'nasdaq',
    '비트코인', 'bitcoin', '가상화폐', 'crypto', '이더리움', 'ethereum',
    '환율', 'exchange',

    // 스포츠/연예/라이프스타일
    '크리켓', 'cricket', '축구', 'football', '야구', 'baseball',
    '리그', 'league', '선수', 'player',
    '영화', 'movie', '드라마', 'drama', '배우', 'actor',
    '가수', 'singer', '콘서트', 'concert',
    '피트니스', 'fitness', '운동', 'workout', 'gym', 'crunch', // Fitness added

    // 사회/고용/정치(상세)
    '일자리', 'job', 'employment', '채용', 'recruit', '청년', 'youth', '노동', 'labor',
    '강훈식', '실장', '의원', '대표', '정당', 'party', 'election', 'vote', '투표', '국회', 'assembly'
];

// 강력한 키워드 (이 키워드가 있으면 해당 카테고리 확정)
const STRONG_KEYWORDS: Record<number, string[]> = {
    [CATEGORY_IDS.GADGET]: [
        '갤럭시 s', 'galaxy s', 's24', 's25', 's26', 's23',
        '아이폰', 'iphone', '맥북', 'macbook', '아이패드', 'ipad', 'mac pro', 'mac mini',
        '픽셀 폰', 'pixel 폰', 'pixel phone',
        '에어팟', 'airpods', '갤럭시 버즈', 'galaxy buds',
        '갤럭시 워치', 'apple watch', '스마트워치',
        '언박싱', 'unboxing',
        'gopro', 'dji', '드론'
    ],
    [CATEGORY_IDS.AI]: [
        'chatgpt', 'gpt-4', 'gpt-5', 'openai',
        'gemini ai', '제미나이', 'claude', '클로드',
        'llm', '대규모 언어 모델',
        'midjourney', 'dall-e', 'sora',
        '생성형 ai', 'generative ai',
        'copilot', '코파일럿',
        '인공지능 도구', 'ai tool', 'ai 도구',
        '머신러닝', 'machine learning', '딥러닝', 'deep learning'
    ],
    [CATEGORY_IDS.SOFTWARE]: [
        'ios 1', 'ios 2',  // ios 16, ios 17, ios 18 등
        'one ui', 'oneui',
        'windows 1', 'windows 2',  // windows 10, 11, 12 등
        'macos',
        '펌웨어 업데이트', 'firmware update',
        '베타 버전', 'beta version'
    ],
    [CATEGORY_IDS.APPS]: [
        '앱 출시', 'app launch', 'app release',
        '게임 출시', 'game launch', 'game release',
        '플레이스토어', 'play store', '앱스토어', 'app store',
        '앱 리뷰', 'app review'
    ],
    [CATEGORY_IDS.TECH]: [
        '양자 컴', 'quantum',
        '반도체 산업', 'semiconductor',
        '5g 네트워크', '6g',
        '블록체인', 'blockchain'
    ],
};

// 일반 키워드 (강력 키워드가 없을 때 사용)
const WEAK_KEYWORDS: Record<number, string[]> = {
    [CATEGORY_IDS.GADGET]: [
        '삼성', 'samsung', '애플', 'apple',
        '스마트폰', 'smartphone', '휴대폰',
        '노트북', 'laptop', '컴퓨터', 'computer', 'pc',
        '태블릿', 'tablet', '모니터', '키보드', '마우스',
        '가젯', 'gadget', '리뷰', 'review',
        '카메라', 'tv', '텔레비전'
    ],
    [CATEGORY_IDS.AI]: [
        ' ai ', ' ai,', ' ai.', 'ai ',
        '인공지능', '자율주행', 'autonomous', '로봇', 'robot'
    ],
    [CATEGORY_IDS.SOFTWARE]: [
        '업데이트', 'update', '운영체제', 'os '
    ],
    [CATEGORY_IDS.APPS]: [
        '앱', 'app', '게임', 'game'
    ],
    [CATEGORY_IDS.TECH]: [
        '기술', 'tech', '테크', '반도체', '칩', 'chip'
    ],
};

function classifyContent(title: string, content?: string): number {
    const text = ` ${title} ${content || ''} `.toLowerCase();

    // 0단계: 비-테크 주제 필터링 ('기타'로 강제 분류)
    for (const keyword of NON_TECH_KEYWORDS) {
        if (text.includes(keyword.toLowerCase())) {
            // 예외: 강력한 가젯 키워드가 함께 있는 경우 (예: 아이폰 가격 등)
            const hasGadget = STRONG_KEYWORDS[CATEGORY_IDS.GADGET].some(k => text.includes(k.toLowerCase()));
            if (!hasGadget) {
                return CATEGORY_IDS.OTHER;
            }
        }
    }

    // 1단계: 강력 키워드 매칭 (순서대로 우선순위)
    const priorityOrder = [
        CATEGORY_IDS.AI,       // AI 먼저 (ChatGPT, LLM 등이 확실하면 AI)
        CATEGORY_IDS.GADGET,   // 그 다음 가젯
        CATEGORY_IDS.SOFTWARE, // 소프트웨어
        CATEGORY_IDS.APPS,     // 앱
        CATEGORY_IDS.TECH,     // 테크
    ];

    for (const categoryId of priorityOrder) {
        const strongKeywords = STRONG_KEYWORDS[categoryId] || [];
        for (const keyword of strongKeywords) {
            if (text.includes(keyword.toLowerCase())) {
                return categoryId;
            }
        }
    }

    // 2단계: 약한 키워드 매칭
    for (const categoryId of priorityOrder) {
        const weakKeywords = WEAK_KEYWORDS[categoryId] || [];
        for (const keyword of weakKeywords) {
            if (text.includes(keyword.toLowerCase())) {
                return categoryId;
            }
        }
    }

    // 3단계: 기타
    return CATEGORY_IDS.OTHER;
}

function getCategoryName(id: number): string {
    const names: Record<number, string> = {
        [CATEGORY_IDS.GADGET]: '가젯',
        [CATEGORY_IDS.TECH]: '테크',
        [CATEGORY_IDS.AI]: 'AI',
        [CATEGORY_IDS.SOFTWARE]: '소프트웨어',
        [CATEGORY_IDS.APPS]: '앱',
        [CATEGORY_IDS.OTHER]: '기타',
    };
    return names[id] || '기타';
}

async function reclassifyAllPosts() {
    console.log("🔄 기존 글 카테고리 재분류 시작 (정치/경제/스포츠 제외 강화 - 완화 버전)...\n");

    try {
        const res = await fetch(`${WP_API_URL}/posts?per_page=100&context=edit`, {
            headers: { "Authorization": `Basic ${WP_AUTH}` }
        });

        if (!res.ok) throw new Error(`Failed to fetch posts: ${res.status}`);

        const posts = await res.json();
        console.log(`📚 총 ${posts.length}개의 글을 분석합니다.\n`);

        let updatedCount = 0;

        for (const post of posts) {
            const title = post.title?.raw || post.title?.rendered || '';
            const content = post.content?.raw || post.content?.rendered || '';
            const currentCategories = post.categories || [];

            const newCategoryId = classifyContent(title, content);
            const newCategoryName = getCategoryName(newCategoryId);

            console.log(`[${post.id}] "${title.slice(0, 50)}..."`);
            console.log(`   → ${newCategoryName} (ID: ${newCategoryId})`);

            // 항상 업데이트
            const updateRes = await fetch(`${WP_API_URL}/posts/${post.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Basic ${WP_AUTH}`,
                },
                body: JSON.stringify({ categories: [newCategoryId] })
            });

            if (updateRes.ok) {
                updatedCount++;
            } else {
                console.log(`   ❌ 업데이트 실패\n`);
            }
        }

        console.log("\n========================================");
        console.log(`✅ 완료! 총 ${updatedCount}건 업데이트`);
        console.log("========================================\n");

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

reclassifyAllPosts();
export { };
