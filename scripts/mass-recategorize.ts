
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const WP_API_URL = process.env.WP_API_URL || "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const WP_AUTH = process.env.WP_AUTH;

// Duplicate of logic in route.ts because we can't easily import from app dir in script without babel setup often
const CATEGORY_MAP: Record<string, number> = {
    // AI 관련 (카테고리 ID: 15)
    'ai': 15, 'gpt': 15, 'chatgpt': 15, '인공지능': 15, 'llm': 15, 'openai': 15, 'gemini': 15,
    'claude': 15, 'copilot': 15, 'deepseek': 15, 'machine learning': 15, '머신러닝': 15,
    '딥러닝': 15, 'deep learning': 15, 'neural': 15, 'generative': 15, 'robot': 15, '로봇': 15,

    // Gadget 관련 (카테고리 ID: 4)
    'iphone': 4, 'galaxy': 4, '갤럭시': 4, '아이폰': 4, 'samsung': 4, 'apple': 4,
    'pixel': 4, 'macbook': 4, '맥북': 4, 'ipad': 4, '아이패드': 4, 'airpods': 4,
    'watch': 4, 'fold': 4, 'flip': 4, 'laptop': 4, 'smartphone': 4, '스마트폰': 4,
    'tablet': 4, '태블릿': 4, 'headphone': 4, '이어폰': 4, 'monitor': 4, '모니터': 4,
    'nvidia': 4, 'rtx': 4, 'gpu': 4, 'cpu': 4, 'amd': 4, 'intel': 4, '반도체': 4,
    'camera': 4, '카메라': 4, 'device': 4, '기기': 4,

    // Software 관련 (카테고리 ID: 8)
    '소프트웨어': 8, 'software': 8, 'windows': 8, 'mac': 8, 'ios': 8,
    'android': 8, '안드로이드': 8, 'update': 8, '업데이트': 8, 'chrome': 8,
    'browser': 8, '브라우저': 8, 'security': 8, '보안': 8, 'hack': 8, '해킹': 8,
    'cloud': 8, '클라우드': 8, 'aws': 8, 'azure': 8, 'seo': 8, 'linux': 8,
    'developer': 8, '개발자': 8, 'programming': 8, 'coding': 8,

    // App 관련 (카테고리 ID: 2)
    'app': 2, 'application': 2, '앱': 2, '어플': 2, 'kakao': 2, 'naver': 2,
    'instagram': 2, 'youtube': 2, 'tiktok': 2, 'facebook': 2, 'sns': 2,
    'messenger': 2, '메신저': 2, 'platform': 2, '플랫폼': 2,

     // Tech/General (기타) - 경제, 정책 등 포함 (카테고리 ID: 9)
    'tech': 9, 'technology': 9, '테크': 9, '기술': 9, 'it': 9, 'digital': 9, '디지털': 9,
    'economy': 9, '경제': 9, 'market': 9, '시장': 9, '우리나라': 9, '정책': 9, 'policy': 9,
    'trend': 9, '트렌드': 9, 'future': 9, '미래': 9, 'stock': 9, '주식': 9,
    'investment': 9, '투자': 9, 'fed': 9, '연준': 9, 'bank': 9, '은행': 9,
    'rate': 9, '금리': 9, 'start-up': 9, 'startup': 9, '스타트업': 9,
    'senate': 9, '상원': 9, 'congress': 9, '의회': 9, 'white house': 9, '백악관': 9,
    'demand': 9, '수요': 9, 'supply': 9, '공급': 9, 'sales': 9, '판매': 9, 'revenue': 9, '매출': 9,
};

function getCategoryId(title: string, content: string = ''): number {
    const lowerTitle = title.toLowerCase();
    
    // 1. Title Priority
    for (const [keyword, catId] of Object.entries(CATEGORY_MAP)) {
        if (lowerTitle.includes(keyword.toLowerCase())) {
            return catId;
        }
    }

    // 2. Content Priority (First 500 chars)
    const lowerContent = content.slice(0, 500).toLowerCase();
    for (const [keyword, catId] of Object.entries(CATEGORY_MAP)) {
        if (lowerContent.includes(keyword.toLowerCase())) {
            return catId;
        }
    }

    return 9; // Fallback to Tech
}

async function getAllPosts() {
    let allPosts: any[] = [];
    let page = 1;
    
    console.log("📥 Fetching posts...");

    while (true) {
        try {
            const res = await fetch(`${WP_API_URL}/posts?per_page=100&page=${page}&_fields=id,title,content,categories`, {
                headers: { "Authorization": `Basic ${WP_AUTH}` }
            });

            if (!res.ok) {
                if (res.status === 400) break; // No more pages
                throw new Error(`API Error: ${res.status}`);
            }

            const posts = await res.json();
            if (posts.length === 0) break;

            allPosts = [...allPosts, ...posts];
            console.log(`   Page ${page}: Fetched ${posts.length} posts (Total: ${allPosts.length})`);
            page++;
        } catch (e) {
            console.error(e);
            break;
        }
    }
    return allPosts;
}

async function updateCategory(postId: number, categoryId: number, title: string) {
    console.log(`🔄 Updating [${postId}] "${title}" -> Category ${categoryId}`);
    const res = await fetch(`${WP_API_URL}/posts/${postId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${WP_AUTH}`
        },
        body: JSON.stringify({ categories: [categoryId] })
    });
    if (!res.ok) console.error(`❌ Update failed: ${await res.text()}`);
}

async function main() {
    if (!WP_AUTH) {
        console.error("❌ WP_AUTH missing");
        return;
    }

    const posts = await getAllPosts();
    console.log(`✅ Total posts to check: ${posts.length}`);

    let updatedCount = 0;

    for (const post of posts) {
        const title = post.title.rendered;
        const content = post.content.rendered;
        const currentCat = post.categories?.[0]; // Assuming primary category

        // Decode HTML entities in title for better matching
        const cleanTitle = title.replace(/&#8217;/g, "'").replace(/&#8216;/g, "'").replace(/&amp;/g, "&");

        const newCat = getCategoryId(cleanTitle, content);

        if (currentCat !== newCat) {
             // Logic to be conservative: only change if we are moving TO Tech (9) from AI (15) or App (2) if it doesn't fit
             // OR if we are strongly identifying a Gadget (4)
             
             // Check specific cases user mentioned:
             // 1. Move misplaced AI posts to Tech if they are about Economy/Policy
             if (currentCat === 15 && newCat === 9) {
                 await updateCategory(post.id, newCat, cleanTitle);
                 updatedCount++;
             }
             // 2. Move misplaced AI posts to Gadget if they are about devices
             else if (currentCat === 15 && newCat === 4) {
                 await updateCategory(post.id, newCat, cleanTitle);
                 updatedCount++;
             }
             // 3. Move anything that matches a strong category that is currently just "App" or "Tech" (Refining)
             else if ((currentCat === 2 || currentCat === 9) && newCat !== 9 && newCat !== 2) {
                 // E.g. was Tech, now detected as AI or Gadget -> Update
                 await updateCategory(post.id, newCat, cleanTitle);
                 updatedCount++;
             }
              // 4. Force update for User's "Senate" or "Warsh" examples that might be lingering
             else if (cleanTitle.includes("연준") || cleanTitle.includes("상원") || cleanTitle.includes("백악관")) {
                 if (currentCat !== 9) {
                     await updateCategory(post.id, 9, cleanTitle);
                     updatedCount++;
                 }
             }
             // 5. Force update for "iPhone demand" -> Tech/Gadget
             else if (cleanTitle.includes("수요") || cleanTitle.includes("매출")) {
                 if (currentCat !== 9) { // User said "More like Tech(9)"
                      await updateCategory(post.id, 9, cleanTitle);
                      updatedCount++;
                 }
             }
        }
    }
    console.log(`🎉 Finished. Updated ${updatedCount} posts.`);
}

main();
