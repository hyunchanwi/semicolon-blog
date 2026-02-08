
import { getPostsByCategory } from "@/lib/wp-api";

async function checkTechPosts() {
    console.log("Checking Tech (ID 9) posts...");
    // Assuming Tech is ID 9
    const posts = await getPostsByCategory(9, 5);

    posts.forEach(p => {
        console.log(`[${p.id}] ${p.title.rendered.slice(0, 20)}`);
        console.log(`   - Featured Media ID: ${p.featured_media}`);

        // Check Embedded
        const embeddedMedia = p._embedded?.["wp:featuredmedia"];
        console.log(`   - _embedded present: ${!!embeddedMedia}`);
        if (embeddedMedia) {
            console.log(`   - Source URL: ${embeddedMedia[0]?.source_url}`);
        }

        // Check Content Fallback
        const imgMatch = p.content?.rendered?.match(/<img[^>]+src=['"]([^'"]+)['"]/);
        console.log(`   - Content Image Match: ${imgMatch ? imgMatch[1] : 'None'}`);
        console.log(`   - Content Length: ${p.content?.rendered?.length}`);
    });
}

checkTechPosts();
