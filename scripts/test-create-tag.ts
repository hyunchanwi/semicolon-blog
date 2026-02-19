
import 'dotenv/config';

async function testCreateTag() {
    // User: hyunchan09, Pass: Computer123!@
    const creds = Buffer.from("hyunchan09:Computer123!@").toString('base64');
    const WP_API_URL = "https://wp.semicolonittech.com/wp-json/wp/v2";

    console.log(`Creating test tag at ${WP_API_URL}/tags...`);

    try {
        const createRes = await fetch(`${WP_API_URL}/tags`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${creds}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: "TestTag123",
                slug: "test-tag-123"
            })
        });

        if (!createRes.ok) {
            console.error("Failed to create tag:", await createRes.text());
            return;
        }

        const newTag = await createRes.json();
        console.log(`Tag 'TestTag123' created successfully. ID: ${newTag.id}`);

    } catch (e) {
        console.error("Error:", e);
    }
}

testCreateTag();
