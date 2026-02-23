import * as dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function wpFetch(url: string, options: any = {}): Promise<any> {
    return fetch(url, options);
}

const WP_API_URL = process.env.WP_API_URL || "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

async function main() {
    console.log("Fixing remaining YouTube posts...");
    let page = 1;
    
    while (true) {
        const url = `${WP_API_URL}/posts?per_page=100&page=${page}&status=publish,draft,private`;
        const res = await wpFetch(url, { headers: { 'Authorization': `Basic ${WP_AUTH}` } });
        if (!res.ok) break;

        const posts = await res.json();
        if (!posts || posts.length === 0) break;

        for (const post of posts) {
            const currentContent = post.content?.rendered || "";
            
            if ((currentContent.includes("youtube.com/embed") || currentContent.includes("youtube.com/watch")) && 
                !currentContent.includes('original-video-link') && 
                !currentContent.includes('<!-- Hidden original link')) {
                
                // Looser regex to grab video ID
                const match = currentContent.match(/(?:youtube\.com\/embed\/|youtube\.com\/watch\?v=)([^"&?]+)/);
                
                if (match) {
                    const videoId = match[1];
                    const hiddenLinkHtml = `\n<!-- Hidden original link for duplicate tracking added by update script -->\n<div style="display:none;" class="original-video-link">https://www.youtube.com/watch?v=${videoId}</div>`;
                    const newContent = currentContent + hiddenLinkHtml;

                    console.log(`Fixing post ID ${post.id} (Video: ${videoId})`);

                    await wpFetch(`${WP_API_URL}/posts/${post.id}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Basic ${WP_AUTH}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ content: newContent })
                    });
                } else {
                    console.log(`Could not extract video ID from post ID ${post.id}`);
                }
            }
        }
        page++;
    }
}

main().catch(console.error);
