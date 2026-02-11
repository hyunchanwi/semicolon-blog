
import 'dotenv/config';


import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.prod' });

const WP_API_URL = process.env.WP_API_URL || "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const WP_AUTH = process.env.WP_AUTH;
import { channels } from '../src/lib/youtube-channels';

async function testRotation() {
    if (!WP_AUTH) {
        console.error("WP_AUTH missing");
        return;
    }

    console.log("1. Finding 'YouTube' tag...");
    // 1. Get YouTube Tag ID
    const tagRes = await fetch(`${WP_API_URL}/tags?search=YouTube`, {
        headers: { 'Authorization': `Basic ${WP_AUTH}` }
    });
    const tags = await tagRes.json();
    const youtubeTag = tags.find((t: any) => t.name.toLowerCase() === 'youtube'); // exact match

    if (!youtubeTag) {
        console.error("YouTube tag not found!");
        return;
    }
    console.log(`Found YouTube Tag: ${youtubeTag.id} (${youtubeTag.name})`);

    // 2. Fetch Latest Post with this Tag
    console.log("2. Fetching latest YouTube post...");
    const postsRes = await fetch(`${WP_API_URL}/posts?tags=${youtubeTag.id}&per_page=1&_embed`, {
        headers: { 'Authorization': `Basic ${WP_AUTH}` }
    });
    const posts = await postsRes.json();

    if (posts.length === 0) {
        console.log("No YouTube posts found. Starting from first channel.");
        return;
    }

    const lastPost = posts[0];
    console.log(`Last Post: "${lastPost.title.rendered}" (ID: ${lastPost.id})`);

    // 3. Inspect Tags for Channel Name
    console.log("Checking tags for channel name...");
    const postTags = lastPost._embedded?.['wp:term']?.[1] || []; // tags are usually term 1
    // OR fetch tags using post.tags IDs if embedded not available
    // But let's assume we can get tags.

    // We already have channel list
    let matchedChannel = null;

    // Fetch detailed tags if needed (the post object has 'tags' array of IDs)
    if (lastPost.tags && lastPost.tags.length > 0) {
        console.log(`fetching tags details: ${lastPost.tags.join(',')}`);
        const tagsRes = await fetch(`${WP_API_URL}/tags?include=${lastPost.tags.join(',')}`, {
            headers: { 'Authorization': `Basic ${WP_AUTH}` }
        });
        const tagsDetails = await tagsRes.json();

        for (const t of tagsDetails) {
            console.log(`Tag: ${t.name}`);
            const ch = channels.find(c => c.name.toLowerCase() === t.name.toLowerCase() || c.name.toLowerCase().includes(t.name.toLowerCase()));
            if (ch) {
                matchedChannel = ch;
                console.log(`Matched Channel from Tag: ${ch.name}`);
                break;
            }
        }
    }

    if (matchedChannel) {
        const idx = channels.findIndex(c => c.name === matchedChannel.name);
        const nextIdx = (idx + 1) % channels.length;
        console.log(`Next Channel Logic: Found ${matchedChannel.name} (Index ${idx}) -> Next is ${channels[nextIdx].name}`);
    } else {
        console.log("No channel tag found on last post.");
    }

    // 4. Test Search by ID (Robust Duplicate Check)
    // Use a known ID if possible, or just search for the last post's title
    console.log("4. Testing Search capabilities...");
    const testQuery = lastPost.title.rendered;
    const searchRes = await fetch(`${WP_API_URL}/posts?search=${encodeURIComponent(testQuery)}&per_page=1`, {
        headers: { 'Authorization': `Basic ${WP_AUTH}` }
    });
    if (searchRes.ok) {
        const sData = await searchRes.json();
        if (sData.length > 0) {
            console.log(`Search by Title matched: ${sData[0].id}`);
        } else {
            console.log("Search by Title failed.");
        }
    }
}

testRotation();
