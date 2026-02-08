/**
 * Removing duplicate posts script
 */
// import { getPosts, deletePost } from '../src/lib/wp-admin-api'; // Remove invalid import

const WP_API_URL = "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const WP_AUTH = Buffer.from("hyunchan09@gmail.com:wsbh 3VHB YwU9 EUap jLq5 QAWT").toString("base64");

async function removeDuplicates() {
    console.log("🔍 중복 글 검색 시작...");

    // Fetch all posts (up to 100 for now, or loop)
    const res = await fetch(`${WP_API_URL}/posts?per_page=100&_fields=id,title`, {
        headers: { "Authorization": `Basic ${WP_AUTH}` }
    });

    if (!res.ok) {
        console.error("Failed to fetch posts");
        return;
    }

    const posts = await res.json();

    const titleMap = new Map();
    const duplicates: any[] = []; // Explicit type

    posts.forEach((post: any) => {
        const title = post.title.rendered.trim();
        if (titleMap.has(title)) {
            duplicates.push(post);
        } else {
            titleMap.set(title, post.id);
        }
    });

    console.log(`📋 총 ${posts.length}개 글 중 ${duplicates.length}개의 중복 발견.`);

    for (const post of duplicates) {
        console.log(`🗑️ 삭제 중: [${post.id}] ${post.title.rendered}`);
        const delRes = await fetch(`${WP_API_URL}/posts/${post.id}?force=true`, {
            method: "DELETE",
            headers: { "Authorization": `Basic ${WP_AUTH}` }
        });
        if (delRes.ok) console.log("   ✅ 삭제 완료");
        else console.log("   ❌ 삭제 실패");
    }
}

removeDuplicates();

export { }; // Module scope
