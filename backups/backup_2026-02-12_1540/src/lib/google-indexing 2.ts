import { google } from 'googleapis';

let authClient: any = null;
let indexingClient: any = null;

function getClients() {
    if (authClient && indexingClient) return { auth: authClient, indexing: indexingClient };

    const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
        return null;
    }

    authClient = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    indexingClient = google.indexing('v3');
    return { auth: authClient, indexing: indexingClient };
}

/**
 * 구글에 특정 URL의 색인을 요청합니다.
 * @param url 색인을 요청할 절대 경로 URL
 */
export async function googlePublishUrl(url: string) {
    const clients = getClients();
    if (!clients) {
        console.warn('[Google Indexing] Skipping notification: Missing credentials.');
        return null;
    }

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
        console.error(`[Google Indexing] ❌ Failed to notify for: ${url}`, error.response?.data || error.message);
        return null;
    }
}
