import { POST } from "../src/app/api/cron/howto/route";

async function run() {
    console.log("Starting How-To Cron simulation...");
    try {
        const req = new Request("http://localhost:3000/api/cron/howto", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.CRON_SECRET}`
            }
        });
        const res = await POST(req);
        console.log(`Status: ${res.status}`);
        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Simulation failed:", e);
    }
}
run();
