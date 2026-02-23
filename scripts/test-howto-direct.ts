import { POST } from "../src/app/api/cron/howto/route";
import { NextRequest } from "next/server";

async function run() {
    try {
        const req = new Request("http://localhost:3000/api/cron/howto?force=1", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.CRON_SECRET}`
            }
        });
        // We have to mock NextRequest since we are running in Node
        const nextReq = new NextRequest(req);
        
        console.log("Running POST...");
        const res = await POST(nextReq);
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Data:", data);
    } catch (e) {
        console.error("Direct call failed:", e);
    }
}
run();
