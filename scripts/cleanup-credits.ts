/**
 * Cleanup credits script
 */
const WP_API_URL = "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

async function cleanupCredits() {
    console.log("🧹 썸네일/이미지 출처 문구 제거 시작...");

    // Fetch all posts (100)
    const res = await fetch(`${WP_API_URL}/posts?per_page=100&_fields=id,title,content`, {
        headers: { "Authorization": `Basic ${WP_AUTH}` }
    });

    if (!res.ok) {
        console.error("Failed to fetch posts");
        return;
    }

    const posts = await res.json();
    let updatedCount = 0;

    for (const post of posts) {
        let content = post.content.rendered;
        let modified = false;

        // Patterns to remove
        const patterns = [
            /Thumbnail from [^\s<]+/g,
            /Thumbnail from .*?(\.|<|\n)/g,
            /Image from Search Source/g,
            /Photo by Unsplash \(Fallback\)/g
        ];

        for (const pattern of patterns) {
            if (content.match(pattern)) {
                content = content.replace(pattern, "");
                modified = true;
            }
        }

        // Remove empty figcaptions
        if (modified) {
            content = content.replace(/<figcaption>\s*<\/figcaption>/g, "");

            console.log(`✏️ 수정 중: [${post.id}] ${post.title.rendered}`);

            const updateRes = await fetch(`${WP_API_URL}/posts/${post.id}`, {
                method: "POST",
                headers: {
                    "Authorization": `Basic ${WP_AUTH}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ content: content })
            });

            if (updateRes.ok) {
                console.log("   ✅ 수정 완료");
                updatedCount++;
            } else {
                console.log("   ❌ 수정 실패");
            }
        }
    }

    console.log(`✨ 총 ${updatedCount}개의 글 수정 완료.`);
}

cleanupCredits();
export { };
