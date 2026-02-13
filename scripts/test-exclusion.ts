
import { config } from "dotenv";
config({ path: ".env.local" });

const WP_API_URL = process.env.WP_API_URL || "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const PRODUCTS_CATEGORY_ID = 32;

async function testExclusion() {
    try {
        console.log(`Testing WP API: ${WP_API_URL}`);
        console.log(`Fetching posts excluding category ${PRODUCTS_CATEGORY_ID}...`);

        const res = await fetch(`${WP_API_URL}/posts?per_page=10&categories_exclude=${PRODUCTS_CATEGORY_ID}&_embed`);

        if (!res.ok) {
            console.error("Failed:", res.status);
            return;
        }

        const posts = await res.json();
        console.log(`Fetched ${posts.length} posts.`);

        let foundExcluded = false;
        posts.forEach((p: any) => {
            const isProduct = p.categories.includes(PRODUCTS_CATEGORY_ID);
            console.log(`- [${p.id}] ${p.title.rendered} (Categories: ${p.categories.join(', ')}) -> ${isProduct ? '❌ PRODUCT' : '✅ OK'}`);
            if (isProduct) foundExcluded = true;
        });

        if (foundExcluded) {
            console.log("\n❌ API 'categories_exclude' parameter is NOT working!");
        } else {
            console.log("\n✅ API 'categories_exclude' parameter IS working correctly.");
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

testExclusion();
