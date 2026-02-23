import { fetch as undiciFetch } from 'undici';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://semicolonittech.com';
const CRON_SECRET = process.env.CRON_SECRET || '';

async function runCron(name: string, path: string) {
    console.log(`\n--- Testing ${name} Cron ---`);
    console.log(`URL: ${SITE_URL}${path}`);
    try {
        const res = await undiciFetch(`${SITE_URL}${path}?force=1`, {
            headers: {
                'Authorization': `Bearer ${CRON_SECRET}`
            }
        });

        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Response: ${text.substring(0, 1000)}`);
    } catch (e) {
        console.error(`Error connecting to ${name}:`, e);
    }
}

async function runAll() {
    await runCron('Trend', '/api/cron/generate');
    await runCron('YouTube', '/api/cron/youtube');
    await runCron('How-To', '/api/cron/howto');
}

runAll();
