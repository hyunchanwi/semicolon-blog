import 'dotenv/config';

async function run() {
    console.log("Hitting localhost howto cron...");
    const res = await fetch("http://localhost:3000/api/cron/howto", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${process.env.CRON_SECRET}`
        }
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
}
run();
