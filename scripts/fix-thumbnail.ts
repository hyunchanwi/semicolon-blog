
import { config } from "dotenv";
config({ path: ".env.local" });

const WP_API_URL = process.env.WP_API_URL || "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const WP_AUTH = process.env.WP_AUTH;
const POST_ID = 3297;
const IMAGE_URL = "https://images.samsung.com/is/image/samsung/assets/us/computing/05122023/HD01-HeroKV_01_Win11_Pillar1_M-V2.jpg?$720_N_JPG$";

async function setFeaturedImage() {
    if (!WP_AUTH) {
        console.error("WP_AUTH is missing.");
        return;
    }

    try {
        console.log(`Setting featured image for post ${POST_ID}...`);

        // 1. 이미지를 미디어 라이브러리에 업로드할 수도 있지만, 외부 URL을 바로 쓸 수 있는지 확인
        // 워드프레스 기본적으로 featured_media는 미디어 ID여야 함.
        // 따라서 외부 이미지를 쓰려면 별도 플러그인이 있거나, 이미지를 다운로드해서 업로드해야 함.
        // 또는 포스트 메타에 '_thumbnail_ext_url' 같은 걸 쓸 수도 있음 (테마 의존적).

        // 하지만 여기서는 가장 확실한 방법: 이미지를 다운로드해서 미디어로 업로드하고 연결하기.

        console.log("Downloading image...");
        const imgRes = await fetch(IMAGE_URL);
        if (!imgRes.ok) throw new Error("Failed to download image");
        const arrayBuffer = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log("Uploading media...");
        const mediaRes = await fetch(`${WP_API_URL}/media`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${WP_AUTH}`,
                'Content-Type': 'image/jpeg',
                'Content-Disposition': 'attachment; filename="samsung-galaxy-windows.jpg"'
            },
            body: buffer
        });

        if (!mediaRes.ok) {
            const err = await mediaRes.text();
            throw new Error(`Media upload failed: ${err}`);
        }

        const media = await mediaRes.json();
        console.log(`✅ Media uploaded. ID: ${media.id}`);

        console.log("Updating post...");
        const updateRes = await fetch(`${WP_API_URL}/posts/${POST_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${WP_AUTH}`
            },
            body: JSON.stringify({
                featured_media: media.id
            })
        });

        if (!updateRes.ok) {
            const err = await updateRes.text();
            throw new Error(`Post update failed: ${err}`);
        }

        console.log("✅ Post updated with featured image!");

    } catch (error) {
        console.error("Error:", error);
    }
}

setFeaturedImage();
