import { uploadImageFromUrl } from "../src/lib/wp-server";
import { config } from "dotenv";

config({ path: '.env.local' });
const WP_AUTH = (process.env.WP_AUTH || "").trim();

async function main() {
    console.log("Testing image upload...");
    console.log("WP_AUTH starts with:", WP_AUTH ? WP_AUTH.substring(0, 5) : "MISSING");
    const url = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200";
    const title = "test-image-upload";

    try {
        const result = await uploadImageFromUrl(url, title, WP_AUTH);
        console.log("Upload result:", result);
    } catch (e) {
        console.error("Upload error:", e);
    }
}

main();
