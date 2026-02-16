
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

// Load .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const firstEqual = line.indexOf('=');
        if (firstEqual === -1) return;
        const key = line.substring(0, firstEqual).trim();
        let value = line.substring(firstEqual + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (key && value) process.env[key] = value;
    });
}

const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!clientEmail || !privateKey) {
    console.error('❌ Missing credentials in .env.local');
    process.exit(1);
}

async function checkGoogleStatus() {
    console.log('🔐 Authenticating with Google...');

    const authClient = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    await authClient.authorize();
    const indexing = google.indexing({ version: 'v3', auth: authClient });

    // Test with an older post (ID 3042, Feb 7)
    const testUrl = "https://semicolonittech.com/blog/%ed%95%84%eb%9d%bc%eb%8d%b8%ed%94%bc%ec%95%84-%eb%b0%98%eb%8f%84%ec%b2%b4-%ec%a7%80%ec%88%98sox-ai-%ec%8b%9c%eb%8c%80-%ec%99%9c-%ec%9d%b4-%ec%a7%80%ec%88%98%ea%b0%80-%ea%b8%80%eb%a1%9c%eb%b2%8c-%ec%a6%9d%ec%8b%9c";

    console.log(`\n🔍 1. Attempting to PUBLISH (Update) URL:\n${testUrl}\n`);

    try {
        const publishRes = await indexing.urlNotifications.publish({
            requestBody: {
                url: testUrl,
                type: 'URL_UPDATED'
            }
        });
        console.log('✅ Publish Response:', JSON.stringify(publishRes.data, null, 2));
    } catch (error: any) {
        console.error('❌ Publish Failed:', error.message);
        if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
    }

    console.log(`\n🔍 2. Querying Metadata for:\n${testUrl}\n`);

    try {
        const res = await indexing.urlNotifications.getMetadata({
            url: testUrl
        });

        console.log('✅ Metadata Response:', JSON.stringify(res.data, null, 2));

        if (res.data.latestUpdate) {
            console.log('\n📅 Latest Update from Google:', res.data.latestUpdate.notifyTime);
        }

    } catch (error: any) {
        if (error.code === 404) {
            console.error('⚠️ URL not found in Indexing API (Never requested?)');
        } else {
            console.error('❌ Metadata Error:', error.message);
            if (error.response) {
                console.error(JSON.stringify(error.response.data, null, 2));
            }
        }
    }
}

checkGoogleStatus();
