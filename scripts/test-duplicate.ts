
import { getRecentAutomationPosts, isDuplicateIdeally } from "../src/lib/wp-server";
import { config } from "dotenv";
config({ path: ".env.local" });

const WP_AUTH = process.env.WP_AUTH || "";

async function testDuplicateLogic() {
    console.log("🚀 Testing Duplicate Logic (Batch + Memory)...");

    if (!WP_AUTH) {
        console.error("❌ No WP_AUTH found");
        return;
    }

    // 1. Fetch Existing Posts
    console.log("1. Fetching existing posts...");
    const existingPosts = await getRecentAutomationPosts(WP_AUTH);
    console.log(`✅ Loaded ${existingPosts.length} posts.`);

    if (existingPosts.length > 0) {
        console.log("Sample Entry:", existingPosts[0]);
    }

    // 2. Test Cases
    const testCases = [
        {
            name: "New Unique Video",
            id: "unique_id_123",
            title: "Super Unique 2026 Tech Review",
            expected: false
        },
        {
            name: "Duplicate ID",
            id: existingPosts[0]?.videoId || "test_id", // Use real ID if available
            title: "Random Title",
            expected: true
        },
        {
            name: "Similar Title",
            id: "new_id_456",
            title: existingPosts[0]?.title || "Test Title", // Use real title
            expected: true
        }
    ];

    console.log("\n2. Running Test Cases...");

    for (const test of testCases) {
        const result = isDuplicateIdeally(test.id, test.title, existingPosts);
        const passed = result.isDuplicate === test.expected;

        console.log(`[${test.name}] Expected: ${test.expected}, Got: ${result.isDuplicate} (${result.reason}) -> ${passed ? "✅ PASS" : "❌ FAIL"}`);
    }
}

testDuplicateLogic();
