import * as dotenv from "dotenv";
import { NextRequest } from "next/server";

dotenv.config({ path: '.env.local' });

async function main() {
    console.log("Loading YouTube cron module...");
    const { GET } = await import("../src/app/api/cron/youtube/route");

    console.log(`Testing YouTube Cron...`);

    const req = new NextRequest(`http://localhost:3000/api/cron/youtube`, {
        headers: {
            "Authorization": `Bearer ${process.env.CRON_SECRET}`
        }
    });

    const startTime = Date.now();
    const res = await GET(req);
    const duration = (Date.now() - startTime) / 1000;

    console.log(`Status: ${res.status}`);
    console.log(`Completed in ${duration.toFixed(2)} seconds`);

    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
