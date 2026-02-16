
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { googlePublishUrl } from '../src/lib/google-indexing';

// Load .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    console.log('Loading .env.local...');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const firstEqual = line.indexOf('=');
        if (firstEqual === -1) return;
        const key = line.substring(0, firstEqual).trim();
        let value = line.substring(firstEqual + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (key && value) process.env[key] = value;
    });
}

async function debug() {
    console.log('🔍 환경변수 확인:');
    console.log('EMAIL:', process.env.GOOGLE_INDEXING_CLIENT_EMAIL ? '✅ 존재' : '❌ 없음');
    console.log('PRIVATE_KEY:', process.env.GOOGLE_INDEXING_PRIVATE_KEY ?
        `✅ 존재 (길이: ${process.env.GOOGLE_INDEXING_PRIVATE_KEY.length})` :
        '❌ 없음'
    );

    if (process.env.GOOGLE_INDEXING_PRIVATE_KEY) {
        const key = process.env.GOOGLE_INDEXING_PRIVATE_KEY;
        console.log('KEY 시작:', key.substring(0, 30));
        console.log('\\n 포함 여부:', key.includes('\\n') ? '✅ 있음' : '❌ 없음 (문제일 수 있음)');
    }

    console.log('\n🧪 색인 API 테스트:');
    try {
        // Use a test URL known to be part of the site
        const result = await googlePublishUrl('https://semicolonittech.com/');

        if (result) {
            console.log('✅ 성공!');
            console.log('응답:', JSON.stringify(result, null, 2));
        } else {
            console.log('❌ 실패: null 반환 (환경변수 문제 또는 코드 내부 로직)');
        }
    } catch (error: any) {
        console.error('❌ 에러 발생:');
        console.error('코드:', error.code);
        console.error('메시지:', error.message);

        if (error.code === 403) {
            console.error('\n👉 권한 문제: GSC에서 Service Account 권한 확인 필요');
        } else if (error.message?.includes('PEM')) {
            console.error('\n👉 Private Key 형식 오류: \\n 개행문자 확인 필요');
        } else if (error.code === 404) {
            console.error('\n👉 API 미활성화: Google Cloud Console에서 Indexing API 활성화 필요');
        }
    }
}

debug();
