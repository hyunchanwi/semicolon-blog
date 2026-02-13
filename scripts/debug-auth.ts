
import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debugAuth() {
    const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
    const privateKeyRaw = process.env.GOOGLE_INDEXING_PRIVATE_KEY;

    console.log('--- Auth Debug ---');
    console.log(`Email: ${clientEmail}`);

    if (!privateKeyRaw) {
        console.error('❌ Missing PRIVATE_KEY');
        return;
    }

    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
    console.log(`Key Length: ${privateKey.length}`);
    console.log(`Starts with: ${privateKey.substring(0, 30)}...`);
    console.log(`Ends with: ...${privateKey.substring(privateKey.length - 30)}`);
    console.log(`Has newlines: ${privateKey.includes('\n')}`);

    try {
        const authClient = new google.auth.JWT({
            email: clientEmail,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/indexing'],
        });

        console.log('Attempting to authorize...');
        const token = await authClient.authorize();
        console.log('✅ Authorization Successful!');
        console.log(`Access Token: ${token.access_token.substring(0, 10)}...`);

        // If auth works, try metadata call again with authorized client
        const indexing = google.indexing({ version: 'v3', auth: authClient });
        // Test with a specific post URL (Encoded)
        const testUrl = "https://semicolonittech.com/blog/%ea%b5%ac%ea%b8%80-ai-%eb%b8%8c%eb%9d%bc%ec%9a%b0%ec%a0%80-disco-%ec%99%84%eb%b2%bd-%ec%a0%95%eb%a6%ac-gentabs-%ea%b8%b0%eb%8a%a5%ea%b3%bc-%ec%82%ac%ec%9a%a9%eb%b2%95-%ec%b4%9d%ec%a0%95%eb%a6%ac";

        console.log(`Publishing update for: ${testUrl}`);
        const pubRes = await indexing.urlNotifications.publish({
            requestBody: {
                url: testUrl,
                type: "URL_UPDATED"
            }
        });
        console.log('✅ Publish Success:', pubRes.status);
        console.log('Response:', JSON.stringify(pubRes.data, null, 2));

        // Wait a bit
        await new Promise(r => setTimeout(r, 2000));

        console.log(`Checking metadata for: ${testUrl}`);
        const metaRes = await indexing.urlNotifications.getMetadata({
            url: testUrl
        });
        console.log('✅ Metadata Success:', metaRes.status);
        console.log('Metadata:', JSON.stringify(metaRes.data, null, 2));

    } catch (e: any) {
        console.error('❌ Auth/API Error:', e.message);
        if (e.response) {
            console.error('Response Data:', JSON.stringify(e.response.data, null, 2));
        }
    }
}

debugAuth();
