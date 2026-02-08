
import { getPosts, getPostsByCategory } from "@/lib/wp-api";

async function verifyContent() {
    console.log("Fetching posts...");
    const posts = await getPosts(5);
    console.log(`Fetched ${posts.length} posts.`);
    posts.forEach(p => {
        console.log(`[${p.id}] ${p.title.rendered.slice(0, 20)}... | Content present: ${!!p.content?.rendered} | Content length: ${p.content?.rendered?.length}`);
    });
}

verifyContent();
