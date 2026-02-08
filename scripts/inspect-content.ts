
import { getPostsByCategory } from "@/lib/wp-api";

async function inspectContent() {
    const posts = await getPostsByCategory(9, 1);
    if (posts.length > 0) {
        console.log("Title:", posts[0].title.rendered);
        console.log("--- Content Start ---");
        console.log(posts[0].content.rendered.slice(0, 1000));
        console.log("--- Content End ---");
    }
}

inspectContent();
