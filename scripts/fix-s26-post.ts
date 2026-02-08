
const WP_API_URL = "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const WP_AUTH = Buffer.from("hyunchan09@gmail.com:wsbh 3VHB YwU9 EUap jLq5 QAWT").toString("base64");
export { };

async function updateS26Post() {
    try {
        console.log("Updating S26 Post (ID: 2954) to Category 4 (Gadgets)...");

        const res = await fetch(`${WP_API_URL}/posts/2954`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${WP_AUTH}`,
            },
            body: JSON.stringify({
                categories: [4] // Gadgets
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message);
        }

        const data = await res.json();
        console.log(`Success! Post ${data.id} updated. Categories: ${JSON.stringify(data.categories)}`);

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

updateS26Post();
