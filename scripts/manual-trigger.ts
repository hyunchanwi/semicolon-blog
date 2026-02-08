
const TARGET_URL = "https://semicolon-next.vercel.app/api/cron/generate";
const SECRET = "my-super-secret-cron-key-2026";
export { };

async function run() {
    console.log(`Triggering ${TARGET_URL}...`);
    try {
        const res = await fetch(TARGET_URL, {
            headers: {
                "Authorization": `Bearer ${SECRET}`
            }
        });

        console.log(`Status: ${res.status}`);
        if (!res.ok) {
            console.log("Error:", await res.text());
        } else {
            const json = await res.json();
            console.log("Success:", JSON.stringify(json, null, 2));
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

run();
