import { google } from 'googleapis';

let authClient: any = null;
let indexingClient: any = null;

function getClients() {
    if (authClient && indexingClient) return { auth: authClient, indexing: indexingClient };

    const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
        console.error('🚨 [Google Indexing] CRITICAL: Missing environment variables!');
        console.error('Required: GOOGLE_INDEXING_CLIENT_EMAIL, GOOGLE_INDEXING_PRIVATE_KEY');
        console.error('Current NODE_ENV:', process.env.NODE_ENV);

        // 개발 환경에서는 명확한 에러 throw
        if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Development mode: skipping Google Indexing to avoid crash if not needed.');
            return null;
        }

        return null;
    }

    console.log('✅ [Google Indexing] Credentials loaded successfully');

    authClient = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    indexingClient = google.indexing('v3');
    return { auth: authClient, indexing: indexingClient };
}

// URL 유효성 검사 및 정규화
function validateUrl(url: string): string | null {
    try {
        const parsed = new URL(url);

        // 1. HTTPS 강제
        if (parsed.protocol !== 'https:') {
            parsed.protocol = 'https:';
        }

        // 2. 도메인 체크 (Prod only)
        // Skip domain check if specifically configured to allow all
        if (process.env.NODE_ENV === 'production' &&
            !parsed.hostname.includes('semicolonittech.com') &&
            !parsed.hostname.includes('vercel.app')) {
            console.warn(`[Google Indexing] ⚠️ Skipping non-production domain: ${parsed.hostname}`);
            return null;
        }

        // 3. 이중 슬래시 제거 (Path 정규화)
        parsed.pathname = parsed.pathname.replace(/\/{2,}/g, '/');

        return parsed.toString();
    } catch (e) {
        console.error(`[Google Indexing] ❌ Invalid URL format: ${url}`, e);
        return null;
    }
}

/**
 * 구글에 특정 URL의 색인을 요청합니다.
 * @param rawUrl 색인을 요청할 절대 경로 URL
 */
export async function googlePublishUrl(rawUrl: string) {
    const clients = getClients();
    if (!clients) {
        console.warn('[Google Indexing] Skipping notification: Missing credentials.');
        return null;
    }

    const url = validateUrl(rawUrl);
    if (!url) return null;

    const { auth, indexing } = clients;

    try {
        const res = await indexing.urlNotifications.publish({
            auth,
            requestBody: {
                url,
                type: 'URL_UPDATED',
            },
        });
        console.log(`[Google Indexing] ✅ Successfully notified for: ${url}`);
        return res.data;
    } catch (error: any) {
        const status = error.response?.status || error.code;
        const message = error.response?.data?.error?.message || error.message;

        if (status === 403) {
            console.error(`[Google Indexing] 🚫 403 Forbidden: Service Account 권한 확인 필요. (GSC 소유권/사용자 추가 확인)`);
        } else if (status === 429) {
            console.error(`[Google Indexing] ⏳ 429 Too Many Requests: 일일 할당량 초과. (Quota Limit)`);
        } else {
            console.error(`[Google Indexing] ❌ Failed to notify for: ${url} (Status: ${status})`, message);
        }
        return null;
    }
}
