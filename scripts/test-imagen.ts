import * as dotenv from "dotenv";
dotenv.config({ path: '.env.local' });

async function testImagen() {
    const apiKey = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "").split(',')[0].trim();
    if (!apiKey) {
        console.error("No Gemini API key found.");
        return;
    }

    const start = Date.now();
    console.log("Calling Imagen 4.0 Fast via predict REST API...");

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                instances: [{ prompt: "A sleek futuristic smartphone on a modern desk, high quality, photorealistic, cinematic lighting" }],
                parameters: { sampleCount: 1 }
            })
        });

        const data = await response.json();
        const duration = (Date.now() - start) / 1000;

        if (response.ok && data.predictions && data.predictions.length > 0) {
            console.log(`Success! Image generated in ${duration.toFixed(2)}s`);
            console.log("Image data length:", data.predictions[0].bytesBase64Encoded?.length || "No Base64 bytes");
        } else {
            console.error("Failed:", data);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

testImagen();
