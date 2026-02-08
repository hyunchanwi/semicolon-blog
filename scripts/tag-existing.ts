/**
 * Tag existing posts script
 */
const WP_API_URL = "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const WP_AUTH = Buffer.from("hyunchan09@gmail.com:wsbh 3VHB YwU9 EUap jLq5 QAWT").toString("base64");

async function tagExistingPosts() {
    console.log("🏷️ 기존 글 태그 작업 시작...");

    // 1. Get/Create Tags
    const tagsRes = await fetch(`${WP_API_URL}/tags?per_page=100`, {
        headers: { "Authorization": `Basic ${WP_AUTH}` }
    });
    const tags = await tagsRes.json();

    let youtubeTagId = tags.find((t: any) => t.name.toLowerCase() === 'youtube')?.id;
    if (!youtubeTagId) {
        console.log("Creating YouTube tag...");
        const res = await fetch(`${WP_API_URL}/tags`, {
            method: 'POST',
            headers: {
                "Authorization": `Basic ${WP_AUTH}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name: 'YouTube' })
        });
        youtubeTagId = (await res.json()).id;
    }

    // 2. Process Posts
    const postsRes = await fetch(`${WP_API_URL}/posts?per_page=100&_fields=id,title,content,tags`, {
        headers: { "Authorization": `Basic ${WP_AUTH}` }
    });
    const posts = await postsRes.json();

    let count = 0;
    for (const post of posts) {
        const content = post.content.rendered;
        if (content.includes('youtube.com/embed')) {
            // Check if already tagged
            if (post.tags.includes(youtubeTagId)) continue;

            const newTags = [...post.tags, youtubeTagId];
            console.log(`[${post.id}] Marking as YouTube: ${post.title.rendered}`);

            await fetch(`${WP_API_URL}/posts/${post.id}`, {
                method: 'POST',
                headers: {
                    "Authorization": `Basic ${WP_AUTH}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ tags: newTags })
            });
            count++;
        }
    }

    console.log(`✨ 총 ${count}개의 글에 YouTube 태그 적용 완료.`);
}

tagExistingPosts();
export { };
