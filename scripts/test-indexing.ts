/**
 * Google Indexing API 테스트 스크립트
 * 실제로 API가 호출되는지 확인합니다.
 */

import * as dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config({ path: '.env.local' });

async function testIndexing() {
    console.log("=== Google Indexing API 테스트 ===\n");

    // 1. 환경변수 확인
    const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY?.replace(/\\n/g, '\n');

    console.log("1️⃣ 환경변수 체크:");
    console.log(`   CLIENT_EMAIL: ${clientEmail ? '✅ ' + clientEmail : '❌ 없음'}`);
    console.log(`   PRIVATE_KEY: ${privateKey ? '✅ 있음 (' + privateKey.length + '자)' : '❌ 없음'}`);
    console.log(`   키 시작: ${privateKey?.substring(0, 30)}...`);
    console.log(`   키 끝: ...${privateKey?.substring(privateKey.length - 30)}`);

    if (!clientEmail || !privateKey) {
        console.error("\n❌ 환경변수가 없습니다. .env.local을 확인하세요.");
        return;
    }

    // 2. JWT 인증 테스트
    console.log("\n2️⃣ JWT 인증 테스트...");
    try {
        const auth = new google.auth.JWT({
            email: clientEmail,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/indexing'],
        });

        await auth.authorize();
        console.log("   ✅ JWT 인증 성공!");
    } catch (error: any) {
        console.error("   ❌ JWT 인증 실패:", error.message);
        console.error("   → 프라이빗 키 포맷이 잘못되었을 수 있습니다.");
        return;
    }

    // 3. 실제 색인 요청 테스트 (최근 글 URL 사용)
    const testUrl = "https://semicolonittech.com/blog/best-ai-coding-tools-2026";
    console.log(`\n3️⃣ 실제 색인 요청 테스트: ${testUrl}`);

    try {
        const auth = new google.auth.JWT({
            email: clientEmail,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/indexing'],
        });

        const indexing = google.indexing('v3');
        const res = await indexing.urlNotifications.publish({
            auth,
            requestBody: {
                url: testUrl,
                type: 'URL_UPDATED',
            },
        });

        console.log("   ✅ 색인 요청 성공!");
        console.log("   Response:", JSON.stringify(res.data, null, 2));
    } catch (error: any) {
        const status = error.response?.status || error.code;
        const message = error.response?.data?.error?.message || error.message;
        console.error(`   ❌ 색인 요청 실패 (Status: ${status})`);
        console.error(`   메시지: ${message}`);

        if (status === 403) {
            console.error("\n   💡 해결방법: Google Search Console에서 서비스 계정을 소유자로 추가해야 합니다.");
            console.error(`   → ${clientEmail} 을 GSC 소유자로 추가하세요.`);
        } else if (status === 429) {
            console.error("\n   💡 일일 할당량 초과. 내일 다시 시도하세요.");
        }
    }
}

testIndexing();
