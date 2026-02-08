

const WP_API_URL = "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
export { };

async function main() {
    console.log("Fetching categories...");
    const res = await fetch(`${WP_API_URL}/categories?per_page=50`);
    const categories = await res.json();
    console.log(`Found ${categories.length} categories.`);

    if (categories.length === 0) {
        console.log("No categories found.");
        return;
    }

    // Print all categories
    categories.forEach((c: any) => console.log(`[${c.id}] ${c.name} (count: ${c.count})`));

    // Pick a category with posts
    const targetCategory = categories.find((c: any) => c.count > 0 && c.name !== 'Uncategorized');
    const catToTest = targetCategory || categories[0];

    console.log(`\nTesting filter for Category: [${catToTest.id}] ${catToTest.name} (Expected count: ${catToTest.count})`);

    try {
        const postsRes = await fetch(`${WP_API_URL}/posts?categories=${catToTest.id}&per_page=5`);
        const posts = await postsRes.json();
        console.log(`Fetched ${posts.length} posts.`);
        posts.forEach((p: any) => console.log(` - [${p.id}] ${p.title.rendered}`));

        if (posts.length === 0 && catToTest.count > 0) {
            console.error("!!! API returned 0 posts but category count is > 0. Filtering might be broken.");
        }
    } catch (e: any) {
        console.error("Error fetching posts by category:", e.message);
    }
}

main().catch(console.error);
