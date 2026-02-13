
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

    if (!clientEmail || !privateKey) {
        console.error("❌ Missing credentials");
        return;
    }
    console.log(`Using Service Account: ${clientEmail}`);
    console.log(`Scope: https://www.googleapis.com/auth/indexing`);

    const authClient = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const indexing = google.indexing({ version: 'v3', auth: authClient });

    try {
        console.log(`Checking status for: ${url}`);
        const res = await indexing.urlNotifications.getMetadata({
            url: url,
        });

        console.log("✅ Status Response:");
        console.log(JSON.stringify(res.data, null, 2));

    } catch (e: any) {
        console.error("❌ Error checking status:", e.response?.data || e.message);
    }
}

// Check a specific post URL that was re-indexed yesterday
const testUrl = "https://semicolonittech.com/blog/%ea%b5%ac%ea%b8%80-ai-%eb%b8%8c%eb%9d%bc%ec%9a%b0%ec%a0%80-disco-%ec%99%84%eb%b2%bd-%ec%a0%95%eb%a6%ac-gentabs-%ea%b8%b0%eb%8a%a5%ea%b3%bc-%ec%82%ac%ec%9a%a9%eb%b2%95-%ec%b4%9d%ec%a0%95%eb%a6%ac";
// (구글 AI 브라우저 Disco... 글)

checkStatus(testUrl);
