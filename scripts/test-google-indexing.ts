import * as dotenv from "dotenv";
dotenv.config({ path: '.env.local' });

import { google } from "googleapis";

async function main() {
    console.log("=== Google Search Console 서비스 계정 권한 진단 ===\n");

    const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
        console.error("❌ 환경 변수 누락");
        return;
    }

    // Search Console API로 사이트 목록 조회
    const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: [
            'https://www.googleapis.com/auth/indexing',
            'https://www.googleapis.com/auth/webmasters',
            'https://www.googleapis.com/auth/webmasters.readonly',
        ],
    });

    // 1. Search Console에 등록된 사이트 목록 조회
    console.log("[1] Search Console 사이트 목록 조회...");
    const searchConsole = google.searchconsole('v1');
    try {
        const sites = await searchConsole.sites.list({ auth });
        console.log(`[1] ✅ 사이트 목록 조회 성공!`);
        if (sites.data.siteEntry && sites.data.siteEntry.length > 0) {
            console.log(`[1]   등록된 사이트 수: ${sites.data.siteEntry.length}`);
            for (const site of sites.data.siteEntry) {
                console.log(`   - ${site.siteUrl} (Permission: ${site.permissionLevel})`);
            }
        } else {
            console.log(`[1] ⚠️ 서비스 계정(${clientEmail})에 연결된 사이트가 없습니다!`);
            console.log(`   → 이것이 색인이 안 되는 핵심 원인입니다!`);
        }
    } catch (error: any) {
        const status = error.response?.status || error.code;
        const message = error.response?.data?.error?.message || error.message;
        console.error(`[1] ❌ 사이트 목록 조회 실패! Status: ${status}`);
        console.error(`   Message: ${message}`);

        if (status === 403) {
            console.error("\n🚨 서비스 계정에 Search Console 접근 권한이 없습니다!");
            console.error("   해결 방법:");
            console.error("   1. https://search.google.com/search-console 접속 (개인 계정으로)");
            console.error("   2. 속성 선택: semicolonittech.com");
            console.error("   3. 설정 > 사용자 및 권한 > '사용자 추가'");
            console.error(`   4. 이메일: ${clientEmail}`);
            console.error("   5. 권한: '소유자'로 설정");
        }
    }

    // 2. 실제 블로그 포스트 URL로 색인 요청 테스트
    const testUrls = [
        "https://semicolonittech.com",
        "https://semicolonittech.com/blog/youtube-premium-lite-deep-analysis-2026",
    ];

    const indexing = google.indexing("v3");

    for (const testUrl of testUrls) {
        console.log(`\n[2] 색인 요청 테스트: ${testUrl}`);
        try {
            const res = await indexing.urlNotifications.publish({
                auth,
                requestBody: {
                    url: testUrl,
                    type: 'URL_UPDATED',
                },
            });
            console.log(`[2] ✅ 색인 요청 응답: ${res.status}`);

            // getMetadata로 상태 확인
            try {
                const meta = await indexing.urlNotifications.getMetadata({
                    auth,
                    url: testUrl,
                });
                console.log(`[2] ✅ 메타데이터:`, JSON.stringify(meta.data, null, 2));
            } catch (metaErr: any) {
                const metaStatus = metaErr.response?.status;
                console.log(`[2] ⚠️ 메타데이터 조회: ${metaStatus} (${metaStatus === 404 ? "아직 색인되지 않음" : "오류"})`);
            }
        } catch (error: any) {
            const status = error.response?.status || error.code;
            const message = error.response?.data?.error?.message || error.message;
            console.error(`[2] ❌ 색인 요청 실패: Status ${status}, ${message}`);
        }
    }

    // 3. Vercel 환경 체크
    console.log(`\n[3] Vercel 환경 변수 확인사항:`);
    console.log(`   Vercel Dashboard > semicolon-next > Settings > Environment Variables에서`);
    console.log(`   GOOGLE_INDEXING_CLIENT_EMAIL과 GOOGLE_INDEXING_PRIVATE_KEY가`);
    console.log(`   Production/Preview 환경에도 모두 설정되어 있는지 확인하세요.`);

    console.log("\n=== 진단 완료 ===");
}

main().catch(console.error);
