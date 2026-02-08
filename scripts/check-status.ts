
const WP_API_URL = "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
export { };

async function checkStatus() {
    try {
        console.log(`Checking posts from ${WP_API_URL}...`);
        const res = await fetch(`${WP_API_URL}/posts?per_page=5&_embed`);
        if (!res.ok) {
            console.error("Failed to fetch posts:", res.status);
            return;
        }
        const posts = await res.json();

        console.log("\n--- Latest 5 Posts ---");
        posts.forEach((p: any) => {
            const date = new Date(p.date).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
            const title = p.title.rendered;
            const hasFeaturedMedia = p.featured_media > 0;
            const mediaDetails = p._embedded?.['wp:featuredmedia']?.[0];
            const mediaUrl = mediaDetails?.source_url || "N/A";

            console.log(`[${date}] ID:${p.id} - ${title}`);
            console.log(`   - Featured Media: ${hasFeaturedMedia ? "✅ Yes" : "❌ No"} (ID: ${p.featured_media})`);
            if (hasFeaturedMedia) {
                console.log(`   - Image URL: ${mediaUrl}`);
            }
            console.log("");
        });

    } catch (e) {
        console.error("Error:", e);
    }
}

checkStatus();
