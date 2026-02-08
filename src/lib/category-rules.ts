/**
 * 카테고리 분류 규칙 (중앙 집중식)
 * 
 * WordPress 카테고리 ID:
 * - 가젯 (Gadget): ID 4
 * - 테크 (Tech): ID 9
 * - AI: ID 15
 * - 소프트웨어 (Software): ID 8
 * - 앱 (Apps): ID 2
 * - 기타 (Other/Uncategorized): ID 1
 */

export const CATEGORY_IDS = {
    GADGET: 4,      // 삼성, 애플, 스마트폰, 컴퓨터, 하드웨어
    GAME: 5,        // 게임, 닌텐도, 플레이스테이션, Xbox
    TECH: 9,        // 양자기술, 기타 테크 (가젯 제외)
    AI: 15,         // 인공지능, 머신러닝, LLM, ChatGPT
    SOFTWARE: 8,    // OS 업데이트, iOS, One UI, Windows
    APPS: 2,        // 앱 출시, 앱 리뷰
    OTHER: 1,       // 그 외 모든 것
};

// 분류 제외 키워드 (이 키워드가 포함되면 무조건 '기타'로 분류)
const NON_TECH_KEYWORDS = [
    // 정치/사회
    '상원', '하원', '의회', '국회', '예산', 'budget', 'congress', 'senate',
    '셧다운', 'shutdown', '선거', 'election', '투표', 'vote', '법안', 'bill',
    '정책', 'policy', '규제', 'regulation', '정부', 'government',
    '대통령', 'president', '총리', 'minister',

    // 경제/주식 (단, 일반적인 '전망', '투자'는 테크 기사에도 쓰이므로 제외)
    // 주식, 증시, 코인 등 금융 상품 자체를 다루는 경우만 제외
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

// 강력한 키워드 + 카테고리별 키워드 (대폭 확장)
const STRONG_KEYWORDS: Record<number, string[]> = {
    [CATEGORY_IDS.GADGET]: [
        '갤럭시 s', 'galaxy s', 's24', 's25', 's26', 's23',
        '아이폰', 'iphone', '맥북', 'macbook', '아이패드', 'ipad', 'mac pro', 'mac mini', 'imac',
        '픽셀 폰', 'pixel 폰', 'pixel phone', '픽셀',
        '에어팟', 'airpods', '갤럭시 버즈', 'galaxy buds', '버즈 프로',
        '갤럭시 워치', 'apple watch', '스마트워치', '울트라 워치',
        '언박싱', 'unboxing', '개봉기',
        'gopro', 'dji', '드론', '인스타360',
        '폴더블', 'foldable', 'z 폴드', 'z 플립', 'flip', 'fold',
        '그래픽카드', 'rtx', 'gpu', '노트북 추천', '태블릿', '모니터',
        '스마트폰', 'smartphone', '핸드폰', '휴대폰'
    ],
    [CATEGORY_IDS.AI]: [
        'chatgpt', 'gpt-4', 'gpt-5', 'openai', 'gpt-4o', 'gpt',
        'gemini', 'gemini ai', '제미나이', 'claude', '클로드', 'anthropic',
        'llm', '대규모 언어 모델', '거대 언어 모델',
        'midjourney', 'dall-e', 'sora',
        '생성형 ai', 'generative ai', '생성형', '생성ai',
        'copilot', '코파일럿',
        '머신러닝', 'machine learning', '딥러닝', 'deep learning'
    ],
    [CATEGORY_IDS.SOFTWARE]: [
        'ios 1', 'ios 2',  // ios 16, ios 17, ios 18 등
        'one ui', 'oneui', 'one ui 7',
        'windows 1', 'windows 2',  // windows 10, 11, 12 등
        'macos', 'ventura', 'sonoma', 'sequoia',
        '펌웨어 업데이트', 'firmware update',
        '베타 버전', 'beta version', '정식 출시',
        '안드로이드 1', '안드로이드 2', 'android 1', 'android 2',
        '업데이트', 'update', '패치', 'patch'
    ],
    [CATEGORY_IDS.GAME]: [
        '게임 출시', 'game launch', 'game release',
        '닌텐도', 'nintendo', 'switch', '스위치',
        'ps5', 'playstation', '플레이스테이션', 'xbox',
        '스팀', 'steam', '에픽게임즈', '게임패스',
        '게임 리뷰', 'game review', '게임 추천',
        '젤다', 'zelda', '마리오', 'mario', '포켓몬', 'pokemon',
        '롤', 'league of legends', '오버워치', 'overwatch',
        '배틀그라운드', 'pubg', '발로란트', 'valorant'
    ],
    [CATEGORY_IDS.APPS]: [
        '앱 출시', 'app launch', 'app release',
        '플레이스토어', 'play store', '앱스토어', 'app store',
        '앱 리뷰', 'app review', '앱 추천',
        '카카오톡', 'kakaotalk', '라인', 'line', '텔레그램', 'telegram',
        '인스타그램', 'instagram', '틱톡', 'tiktok', '유튜브', 'youtube',
        '넷플릭스', 'netflix', '디즈니플러스', 'disney+'
    ],
    [CATEGORY_IDS.TECH]: [
        '양자 컴', 'quantum', '양자 컴퓨팅',
        '반도체', 'semiconductor', '칩', 'chip', '삼성전자', 'tsmc', 'intel', 'amd', 'nvidia',
        '5g', '6g', 'wi-fi', '와이파이',
        '블록체인', 'blockchain', 'web3',
        '클라우드', 'cloud', 'aws', 'azure', 'gcp',
        '사이버 보안', '보안', 'security', '해킹', 'hack'
    ],
};

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

/**
 * 제목/내용을 기반으로 가장 적합한 카테고리 ID를 반환합니다.
 */
export function classifyContent(title: string, content?: string): number {
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

    // 1단계: 강력 키워드 매칭
    const priorityOrder = [
        CATEGORY_IDS.AI,
        CATEGORY_IDS.GADGET,
        CATEGORY_IDS.SOFTWARE,
        CATEGORY_IDS.APPS,
        CATEGORY_IDS.TECH,
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

export function getCategoryName(categoryId: number): string {
    const names: Record<number, string> = {
        [CATEGORY_IDS.GADGET]: '가젯',
        [CATEGORY_IDS.TECH]: '테크',
        [CATEGORY_IDS.AI]: 'AI',
        [CATEGORY_IDS.GAME]: '게임',
        [CATEGORY_IDS.SOFTWARE]: '소프트웨어',
        [CATEGORY_IDS.APPS]: '앱',
        [CATEGORY_IDS.OTHER]: '기타',
    };
    return names[categoryId] || '기타';
}

export function getCategoryIdFromSlug(slug: string): number {
    const slugMap: Record<string, number> = {
        'gadget': CATEGORY_IDS.GADGET,
        'technology': CATEGORY_IDS.TECH,
        'tech': CATEGORY_IDS.TECH,
        'ai': CATEGORY_IDS.AI,
        'software': CATEGORY_IDS.SOFTWARE,
        'games': CATEGORY_IDS.GAME,
        'game': CATEGORY_IDS.GAME,
        'apps': CATEGORY_IDS.APPS,
        'uncategorized': CATEGORY_IDS.OTHER,
        'other': CATEGORY_IDS.OTHER,
    };
    return slugMap[slug.toLowerCase()] || CATEGORY_IDS.OTHER;
}
