/**
 * Delete specific posts
 */
const WP_API_URL = "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

const DELETE_IDS = [3000, 2996, 2987, 2985, 2979, 2836, 2818];

async function deletePosts() {
    console.log("🗑️ 중복 글 삭제 시작...");

    for (const id of DELETE_IDS) {
        console.log(`Deleting ID: ${id}...`);
        const res = await fetch(`${WP_API_URL}/posts/${id}?force=true`, {
            method: "DELETE",
            headers: { "Authorization": `Basic ${WP_AUTH}` }
        });

        if (res.ok) console.log(`   ✅ [${id}] 삭제 완료`);
        else console.log(`   ❌ [${id}] 삭제 실패`);
    }
}

deletePosts();

export { }; // Module scope
