import * as dotenv from "dotenv";
dotenv.config({ path: '.env.local' });

async function main() {
    console.log("Loading modules...");
    const { GET } = await import("../src/app/api/cron/report/route");
    const { NextRequest } = await import("next/server");

    // An extremely long tech article (The Verge Apple Vision Pro Review)
    const targetUrl = "https://www.theverge.com/24054862/apple-vision-pro-review-vr-ar-headset-features-price";

    console.log(`Testing Tech Report Cron with URL: ${targetUrl}`);

    const req = new NextRequest(`http://localhost:3000/api/cron/report?url=${targetUrl}`, {
        headers: {
            "Authorization": `Bearer ${process.env.CRON_SECRET}`
        }
    });

    const res = await GET(req);
    console.log(`Status: ${res.status}`);

    const data = await res.json();
    console.log(data);
}

main().catch(console.error);
