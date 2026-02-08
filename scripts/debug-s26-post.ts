
const WP_API_URL = "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
export { };

async function inspectPost() {
    try {
        // Fetch posts searching for "S26"
        console.log(`Searching for 'S26' posts...`);
        const res = await fetch(`${WP_API_URL}/posts?search=S26&_embed`);
        const posts = await res.json();

        if (posts.length === 0) {
            console.log("No posts found with 'S26'");
            return;
        }

        posts.forEach((p: any) => {
            console.log("\n============================================");
            console.log(`ID: ${p.id}`);
            console.log(`Title: ${p.title.rendered}`);
            console.log(`Status: ${p.status}`);
            console.log(`Categories (IDs): ${JSON.stringify(p.categories)}`);
            console.log(`Featured Media ID: ${p.featured_media}`);

            // Check embedded media
            const media = p._embedded?.['wp:featuredmedia']?.[0];
            console.log(`Media details:`, media ? {
                id: media.id,
                source_url: media.source_url
            } : "None");

            // Check content snippet for YouTube reference
            const content = p.content.rendered;
            console.log(`Content snippet: ${content.slice(0, 100)}...`);
            console.log("============================================\n");
        });

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

inspectPost();
