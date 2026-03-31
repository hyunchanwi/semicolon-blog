import { generateContentWithRetry } from "../src/lib/gemini";
import * as dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function main() {
    const prompt = `
당신은 최신 IT 블로거입니다.
구글 검색을 활용해서 어제 또는 오늘 가장 최신의 '머스크와 샘 알트먼 소송' 혹은 '엔비디아 주가 하락' 관련된 짧은 뉴스 요약을 3문장으로 작성해줘. 
검색을 통해 가장 정확한 올해 최신 정보를 기반으로 작성해야 해.
    `;

    console.log("Calling Gemini WITH Google Search Grounding...");

    try {
        // useGrounding = true
        const result = await generateContentWithRetry(prompt, "gemini-2.5-flash", 3, true);
        const response = await result.response;
        console.log("\n--- GROUNDING RESULT ---\n");
        console.log(response.text());

        // We can also check if grounding was actually used by looking at candidates
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        if (groundingMetadata) {
            console.log("\n✅ Grounding Metadata Found! Sources used:");
            const chunks = groundingMetadata.groundingChunks || [];
            chunks.forEach((chunk: any, i: number) => {
                if (chunk.web?.title) {
                    console.log(`[${i + 1}] ${chunk.web.title} - ${chunk.web.uri}`);
                }
            });
        } else {
            console.log("\n⚠️ No Grounding Metadata found.");
        }
    } catch (e) {
        console.error("Failed:", e);
    }
}

main().catch(console.error);
