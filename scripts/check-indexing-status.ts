
import path from 'path';
import fs from 'fs';

// Load .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const firstEqual = line.indexOf('=');
        if (firstEqual === -1) return;
        const key = line.substring(0, firstEqual).trim();
        let value = line.substring(firstEqual + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (key && value) process.env[key] = value;
    });
}

const WP_API_URL = process.env.WP_API_URL || "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const WP_AUTH = process.env.WP_AUTH;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://semicolonittech.com';

async function checkIndexingStatus() {
    if (!WP_AUTH) {
        console.error("❌ WP_AUTH not set");
        return;
    }

    console.log("🔍 Checking Indexing Status for recent 50 posts...\n");

    // Fetch recent 50 posts with meta
    const res = await fetch(`${WP_API_URL}/posts?per_page=50&status=publish&_fields=id,title,date,slug,link,meta`, {
        headers: { 'Authorization': `Basic ${WP_AUTH}` }
    });

    if (!res.ok) {
        console.error(`❌ Failed to fetch: ${res.status}`);
        return;
    }

    const posts = await res.json();
    let indexedCount = 0;
    let missingCount = 0;

    console.log("--------------------------------------------------------------------------------");
    console.log(`| ID    | Date       | Indexed At           | Title`);
    console.log("--------------------------------------------------------------------------------");

    for (const post of posts) {
        const meta = post.meta || {};
        const indexedAt = meta.indexing_requested_at;
        const date = post.date.split('T')[0];
        const title = post.title.rendered.substring(0, 40) + (post.title.rendered.length > 40 ? '...' : '');

        const isIndexed = !!indexedAt;
        const statusIcon = isIndexed ? "✅" : "⚠️";
        const indexedDisplay = isIndexed ? new Date(indexedAt).toLocaleString('ko-KR') : "Not Requested";

        console.log(`| ${post.id} | ${date} | ${statusIcon} ${indexedDisplay.padEnd(20)} | ${title}`);

        if (isIndexed) {
            indexedCount++;
            // process.stdout.write('.'); // Optional progress indicator
        } else {
            missingCount++;
            console.log(`\n🔴 MISSING INDEX: ID ${post.id} - ${post.title.rendered}`);
            console.log(`   Date: ${date}`);
        }
    }

    console.log("--------------------------------------------------------------------------------");
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Requested: ${indexedCount}`);
    console.log(`   ⚠️ Missing:   ${missingCount}`);
    console.log("\n💡 Note: 'Requested' means the API call was sent to Google.");
    console.log("   It may take 1-3 days for Google to actually show the page in search results.");
}

checkIndexingStatus();
