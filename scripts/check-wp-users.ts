
import { updateCategory, deleteCategory } from "../src/lib/wp-admin-api";

// Initialize using the same Auth as wp-admin-api
const WP_API_URL = "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

async function checkUsers() {
    console.log("Checking WP Users Access...");
    try {
        const res = await fetch(`${WP_API_URL}/users?context=edit`, {
            headers: {
                "Authorization": `Basic ${WP_AUTH}`,
            }
        });

        if (!res.ok) {
            console.error("Failed to fetch users:", res.status, await res.text());
            return;
        }

        const users = await res.json();
        console.log(`Found ${users.length} users.`);
        console.log("First User:", JSON.stringify(users[0], null, 2));

        // Check if we can see 'meta' field
        if (users[0].meta) {
            console.log("User Meta is accessible!");
        } else {
            console.log("User Meta is NOT visible (might need to register meta keys).");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

checkUsers();
