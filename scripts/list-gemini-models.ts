import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();

    let output = "";
    if (data.models) {
        data.models.forEach((m: any) => {
            output += `${m.name}\n`;
        });
    }
    fs.writeFileSync("models_list.txt", output);
    console.log("Saved to models_list.txt");
}

listModels();
