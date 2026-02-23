async function run() {
    try {
        console.log("Fetching with native fetch...");
        const WP_API_URL = "https://wp.semicolonittech.com/wp-json/wp/v2";
        const res = await fetch(`${WP_API_URL}/posts?per_page=1`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log("Success! Native fetch works. First post ID:", data[0]?.id);
    } catch (e) {
        console.error("Native fetch failed:", e);
    }
}
run();
