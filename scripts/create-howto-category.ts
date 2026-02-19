
import 'dotenv/config';

async function createHowToCategory() {
    // Hardcode credentials for reliability in this script
    // User: hyunchan09, Pass: Computer123!@
    const creds = Buffer.from("hyunchan09:Computer123!@").toString('base64');
    const WP_API_URL = "https://wp.semicolonittech.com/wp-json/wp/v2";

    console.log(`Checking categories at ${WP_API_URL}/categories...`);

    try {
        // 1. Check if exists
        const res = await fetch(`${WP_API_URL}/categories?search=사용법`, {
            headers: { 'Authorization': `Basic ${creds}` }
        });
        const categories = await res.json();

        const existing = categories.find((c: any) => c.name === "사용법" || c.slug === "how-to");

        if (existing) {
            console.log(`Category '사용법' already exists. ID: ${existing.id}`);
            return;
        }

        // 2. Create if not exists
        console.log("Creating category '사용법'...");
        const createRes = await fetch(`${WP_API_URL}/categories`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${creds}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: "사용법",
                slug: "how-to",
                description: "IT 기술 및 기기 사용법, 꿀팁, 설치 가이드"
            })
        });

        if (!createRes.ok) {
            console.error("Failed to create category:", await createRes.text());
            return;
        }

        const newCategory = await createRes.json();
        console.log(`Category '사용법' created successfully. ID: ${newCategory.id}`);

    } catch (e) {
        console.error("Error:", e);
    }
}

createHowToCategory();
