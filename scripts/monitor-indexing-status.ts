
import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkStatus(url: string) {
    const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) return false;

    const authClient = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const indexing = google.indexing({ version: 'v3', auth: authClient });

    try {
        await indexing.urlNotifications.getMetadata({ url });
        console.log(`✅ SUCCESS! Authenticated for: ${url}`);
        return true;
    } catch (e: any) {
        console.log(`⏳ Waiting... (${e.message})`);
        return false;
    }
}

async function monitor() {
    const url = "https://semicolonittech.com/"; // URL Prefix
    const targetUrl = "https://semicolonittech.com/blog/%ea%b5%ac%ea%b8%80-ai-%eb%b8%8c%eb%9d%bc%ec%9a%b0%ec%a0%80-disco-%ec%99%84%eb%b2%bd-%ec%a0%95%eb%a6%ac-gentabs-%ea%b8%b0%eb%8a%a5%ea%b3%bc-%ec%82%ac%ec%9a%a9%eb%b2%95-%ec%b4%9d%ec%a0%95%eb%a6%ac";

    console.log("Starting monitor...");
    for (let i = 0; i < 20; i++) { // Try for 10 minutes (30s interval)
        const successRoot = await checkStatus(url);
        if (successRoot) {
            console.log("🎉 Root URL Access Confirmed!");
            await checkStatus(targetUrl);
            process.exit(0);
        }

        await new Promise(r => setTimeout(r, 30000));
    }
    console.log("❌ Monitor timed out.");
    process.exit(1);
}

monitor();
