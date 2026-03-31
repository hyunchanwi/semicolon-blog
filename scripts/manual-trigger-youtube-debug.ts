import { config } from "dotenv";
config({ path: ".env.local" });

import { GET } from "../src/app/api/cron/youtube/route";

async function run() {
    console.log("🚀 강제 유튜브 크론 실행 (Unsplash 썸네일 테스트용) 🚀");

    const req = new Request("http://localhost:3000/api/cron/youtube", {
        headers: {
            'Authorization': `Bearer ${process.env.CRON_SECRET}`
        }
    });

    try {
        const res = await GET(req);
        const data = await res.json();
        console.log("\n✅ 실행 결과:");
        console.log(JSON.stringify(data, null, 2));

        if (data.success && data.postUrl) {
            console.log(`\n🎉 포스팅 성공! URL: ${data.postUrl}`);
        } else if (data.debug?.checkedVideos) {
            console.log(`\n⏭️ 모든 영상이 중복 처리됨. Unsplash 테스트를 위해 WP DB의 임베드 링크를 삭제하거나 새 영상이 올라오길 기다려야 합니다.`);
        }
    } catch (e) {
        console.error("❌ 크론 실행 중 오류 발생:", e);
    }
}

run();
