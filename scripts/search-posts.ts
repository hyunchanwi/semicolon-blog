/**
 * Search posts by keyword
 */
const WP_API_URL = "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

async function searchPosts() {
    console.log("🔍 'Crunch' 관련 글 검색...");

    // Fetch posts
    const res = await fetch(`${WP_API_URL}/posts?search=Crunch&per_page=20&_fields=id,title`, {
        headers: { "Authorization": `Basic ${WP_AUTH}` }
    });

    if (!res.ok) {
        console.error("Failed to fetch posts");
        return;
    }

    const posts = await res.json();

    console.log(`📋 검색 결과: ${posts.length}건`);
    posts.forEach((post: any) => {
        console.log(`[${post.id}] ${post.title.rendered}`);
    });
}

searchPosts();

export { }; // Module scope
