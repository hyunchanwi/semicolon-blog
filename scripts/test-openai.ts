import * as dotenv from "dotenv";

async function testOpenAI() {
    dotenv.config();
    const rawKey = process.env.OPENAI_API_KEY || "";
    const apiKey = rawKey.replace(/[^a-zA-Z0-9_-]/g, '');

    console.log("Cleaned API Key matches format:", apiKey.startsWith('sk-'));

    console.log("Testing DALL-E 3 Image Generation...");
    const start = Date.now();

    try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: "A futuristic laptop on a neon-lit desk, cinematic 3D render, high quality",
                n: 1,
                size: "1024x1024"
            })
        });

        const data = await response.json();
        const duration = (Date.now() - start) / 1000;

        if (response.ok) {
            console.log(`✅ Success! Image generated in ${duration.toFixed(2)}s`);
            console.log("Image URL:", data.data[0].url);
        } else {
            console.error("❌ Failed. API Error:", data.error.message);
        }
    } catch (e) {
        console.error("❌ Network or Execution Error:", e);
    }
}

testOpenAI();
