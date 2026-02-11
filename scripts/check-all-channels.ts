
import { getAllLatestVideos, channels } from "../src/lib/youtube-channels";
import { YouTubeVideo } from "../src/lib/youtube-channels";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function checkChannels() {
    console.log("--- Checking YouTube Channels Status ---");
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    for (const channel of channels) {
        console.log(`\nChecking Channel: ${channel.name} (${channel.id})`);
        const { videos, debugInfo } = await getAllLatestVideos(channel.name);

        if (videos.length === 0) {
            console.log("  ❌ No videos found (or none within 7 days)");
            if (debugInfo) console.log(`  Debug: ${debugInfo}`);
        } else {
            console.log(`  ✅ Found ${videos.length} videos:`);
            videos.forEach(v => {
                console.log(`    - [${v.publishedAt}] ${v.title} (${v.id})`);
            });
        }
    }
}

checkChannels().catch(console.error);
