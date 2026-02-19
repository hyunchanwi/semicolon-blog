
import { config } from "dotenv";
config({ path: ".env.local" });

const WP_API_URL = process.env.WP_API_URL || "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

async function main() {
    console.log(`Fetching categories from ${WP_API_URL}/categories...`);
    const res = await fetch(`${WP_API_URL}/categories?per_page=100`, {
        headers: {
            'Authorization': `Basic ${WP_AUTH}`
        }
    });

    if (!res.ok) {
        console.error("Failed to fetch categories:", await res.text());
        return;
    }

    const categories = await res.json();
    console.log("--- Categories ---");
    categories.forEach((c: any) => {
        console.log(`ID: ${c.id} | Name: ${c.name} | Slug: ${c.slug}`);
    });
}

main();
