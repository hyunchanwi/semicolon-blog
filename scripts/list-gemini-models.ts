import * as dotenv from "dotenv";
dotenv.config({ path: '.env.local' });

async function listModels() {
    const apiKey = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "").split(',')[0].trim();
    if (!apiKey) {
        console.error("No Gemini API key found.");
        return;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (response.ok && data.models) {
            const imageModels = data.models.filter((m: any) => m.name.includes("imagen") || m.name.includes("image"));
            console.log("Image related models found:");
            imageModels.forEach((m: any) => console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods?.join(", ")})`));

            if (imageModels.length === 0) {
                console.log("No Imagen models found in the list. Showing first 5 models as example:");
                data.models.slice(0, 5).forEach((m: any) => console.log(`- ${m.name}`));
            }
        } else {
            console.error("Failed to list models:", data);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

listModels();
