import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function main() {
    const thumbnailUrl = "https://i.ytimg.com/vi/bX9bBqH8X_s/hqdefault.jpg"; // Random tech review video thumbnail
    console.log(`Fetching image: ${thumbnailUrl}`);
    const imgRes = await fetch(thumbnailUrl);
    const arrayBuffer = await imgRes.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg'
        }
    };

    const prompt = `
당신은 IT 블로거입니다. 
첨부된 이미지는 최신 스마트폰 리뷰 영상의 썸네일입니다. 
이미지에 나오는 기기의 색상, 카메라 형태, 두께감, 혹은 배경의 분위기 등 시각적인 요소들만 3문장으로 아주 자연스럽게 묘사해주세요.
`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    console.log("Calling Gemini with Image...");
    const result = await model.generateContent([prompt, imagePart]);
    console.log("\n--- VISUAL ANALYSIS RESULT ---\n");
    console.log(result.response.text());
}

main().catch(console.error);
