import { getPosts } from "../src/lib/wp-api";
async function run() {
    console.log("Fetching posts...");
    const posts = await getPosts(6, 10);
    console.log(`Found ${posts.length} posts`);
    posts.forEach(p => console.log(`- [${p.id}] ${p.title.rendered}`));
}
run();
