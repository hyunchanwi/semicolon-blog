import { GET } from "../src/app/api/cron/howto/route";
import { NextRequest } from "next/server";

async function run() {
    try {
        const req = new Request("http://localhost:3000/api/cron/howto?force=1", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${process.env.CRON_SECRET}`
            }
        });
        const nextReq = new NextRequest(req);
        
        console.log("Running GET directly on route handler...");
        const res = await GET(nextReq);
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Data:", data);
    } catch (e) {
        console.error("Direct call failed with trace:", e);
    }
}
run();
