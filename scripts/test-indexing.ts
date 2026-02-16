
import { googlePublishUrl } from '../src/lib/google-indexing';
import path from 'path';
import fs from 'fs';

// Load .env.local manually for test script
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

async function testIndexing() {
    console.log('🧪 Testing Google Indexing Function...\n');

    // Use a test URL that definitely doesn't exist but has valid format
    const testUrl = 'https://semicolonittech.com/blog/test-indexing-api-verification-' + Date.now();

    console.log(`Target URL: ${testUrl}`);

    try {
        const result = await googlePublishUrl(testUrl);

        if (result) {
            console.log('✅ Success: Function returned valid response.');
            console.log('Response:', JSON.stringify(result, null, 2));
        } else {
            console.log('❌ Failure: Function returned null.');
        }
    } catch (error: any) {
        console.error('❌ Error Thrown:', error.message);
        console.error('Details:', error);
    }
}

testIndexing();
