
import { config } from "dotenv";
config({ path: ".env.local" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://semicolonittech.com";
const CRON_SECRET = process.env.CRON_SECRET;

async function testEndpoint(name: string, path: string) {
    console.log(`[Test] Triggering Live ${name} API... (${path})`);
    const startTime = Date.now();

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 70000); // 70s client timeout

        const res = await fetch(`${SITE_URL}${path}`, {
            headers: {
                "Authorization": `Bearer ${CRON_SECRET}`
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const duration = (Date.now() - startTime) / 1000;

        console.log(`[Test] ${name} Status: ${res.status}`);
        console.log(`[Test] ${name} Duration: ${duration.toFixed(2)}s`);

        if (!res.ok) {
            console.log(`[Test] Error Body:`, await res.text());
        } else {
            const data = await res.json();
            console.log(`[Test] Success Body:`, JSON.stringify(data, null, 2).substring(0, 500) + "...");
        }
    } catch (e: any) {
        const duration = (Date.now() - startTime) / 1000;
        console.error(`[Test] ${name} Failed after ${duration.toFixed(2)}s:`, e.message);
    }
    console.log("------------------------------------------------");
}

async function main() {
    if (!CRON_SECRET) {
        console.error("CRON_SECRET missing in .env.local");
        return;
    }

    // Trigger HowTo (Likely fastest/safest to test)
    await testEndpoint("HowTo", "/api/cron/howto?force=true");

    // Uncomment others if needed, but sequential to avoid load
    // await testEndpoint("Trends", "/api/cron/generate");
    // await testEndpoint("YouTube", "/api/cron/youtube");
}

main();
