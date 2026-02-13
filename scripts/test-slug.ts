
import { config } from "dotenv";
config({ path: ".env.local" });
import { GoogleGenerativeAI } from "@google/generative-ai";

async function testSlugGeneration() {
    console.log("Testing Slug Generation...");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const topic = "2026년 아이폰 18 출시일 및 가격 예상";

    const prompt = `
    Generate a SEO-friendly ENGLISH URL slug for the following Korean topic.
    Topic: "${topic}"
    Current Year: 2026
    
    Format: lowercase, hyphens only, English only.
    Example: iphone-18-release-date-price-2026
    
    Return Only the slug.
    `;

    try {
        const result = await model.generateContent(prompt);
        const slug = result.response.text().trim();
        console.log(`Topic: ${topic}`);
        console.log(`Generated Slug: ${slug}`);

        if (slug.match(/^[a-z0-9-]+$/)) {
            console.log("✅ Valid Slug Format");
        } else {
            console.log("❌ Invalid Slug Format");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

testSlugGeneration();
