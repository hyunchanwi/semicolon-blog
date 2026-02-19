
const WP_API_URL = "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();
export { };

async function cleanAiPosts() {
    try {
        // Fetch recent 20 posts
        const res = await fetch(`${WP_API_URL}/posts?per_page=20&context=edit`, {
            headers: { "Authorization": `Basic ${WP_AUTH}` }
        });
        const posts = await res.json();

        let updatedCount = 0;

        for (const post of posts) {
            let content = post.content.rendered;
            let modified = false;

            // Remove blockquote with "이 글은 ... 채널의 영상을 참고하여"
            if (content.includes("채널의 영상을 참고하여 작성되었습니다")) {
                console.log(`Found attribution in Post ${post.id} (${post.title.rendered})`);
                // Regex to remove the entire blockquote
                content = content.replace(/<blockquote>.*?채널의 영상을 참고하여.*?<\/blockquote>/g, "");
                modified = true;
            }

            if (modified) {
                console.log(`Updating Post ${post.id}...`);
                const updateRes = await fetch(`${WP_API_URL}/posts/${post.id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Basic ${WP_AUTH}`,
                    },
                    body: JSON.stringify({ content })
                });

                if (updateRes.ok) updatedCount++;
                else console.error(`Failed to update ${post.id}`);
            }
        }

        console.log(`Cleanup complete. Updated ${updatedCount} posts.`);

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

cleanAiPosts();
