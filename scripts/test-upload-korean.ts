import { uploadImageFromUrl } from "../src/lib/wp-server";
import { config } from "dotenv";

config({ path: '.env.local' });
const WP_AUTH = (process.env.WP_AUTH || "").trim();

async function main() {
    console.log("Testing image upload with Korean Title...");
    const url = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200";
    const title = "완전한글로만된제목테스트"; // Entirely Korean title

    try {
        const result = await uploadImageFromUrl(url, title, WP_AUTH);
        console.log("Upload result:", result);
    } catch (e) {
        console.error("Upload error:", e);
    }
}

main();
