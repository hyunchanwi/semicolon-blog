/**
 * Subscriber Management Library
 * WordPress의 기존 포스트 메타를 활용하여 구독자를 저장/관리합니다.
 * 
 * 접근 방식: 단일 비공개 포스트로 구독자 목록을 JSON 형태로 관리
 * - 별도 플러그인 불필요
 * - 기존 WordPress REST API만으로 동작
 */

const WP_API_URL = process.env.WP_API_URL || "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

const SUBSCRIBER_POST_SLUG = "semicolon-subscribers-data";

export interface Subscriber {
    email: string;
    tier: "free" | "premium";
    verified: boolean;
    verifyToken: string;
    subscribedAt: string;
    unsubscribeToken: string;
}

/**
 * 토큰 생성 유틸리티
 */
function generateToken(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * 구독자 데이터 저장 포스트 ID 가져오기 (없으면 생성)
 */
async function getSubscriberPostId(): Promise<number | null> {
    try {
        // 1. 기존 포스트 검색
        const searchRes = await fetch(
            `${WP_API_URL}/posts?slug=${SUBSCRIBER_POST_SLUG}&status=private&per_page=1`,
            {
                headers: { Authorization: `Basic ${WP_AUTH}` },
                cache: "no-store",
            }
        );

        if (searchRes.ok) {
            const posts = await searchRes.json();
            if (posts.length > 0) return posts[0].id;
        }

        // 2. 없으면 새로 생성
        console.log("[Subscribers] Creating subscriber data post...");
        const createRes = await fetch(`${WP_API_URL}/posts`, {
            method: "POST",
            headers: {
                Authorization: `Basic ${WP_AUTH}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: "Semicolon Subscribers Data",
                slug: SUBSCRIBER_POST_SLUG,
                status: "private",
                content: JSON.stringify([]),
                meta: { subscriber_data: "true" },
            }),
        });

        if (createRes.ok) {
            const newPost = await createRes.json();
            console.log(`[Subscribers] Created post ID: ${newPost.id}`);
            return newPost.id;
        }

        console.error("[Subscribers] Failed to create subscriber post");
        return null;
    } catch (e) {
        console.error("[Subscribers] Error getting subscriber post:", e);
        return null;
    }
}

/**
 * WordPress에서 구독자 목록 가져오기
 */
async function getSubscribersData(): Promise<Subscriber[]> {
    try {
        const postId = await getSubscriberPostId();
        if (!postId) return [];

        const res = await fetch(
            `${WP_API_URL}/posts/${postId}`,
            {
                headers: { Authorization: `Basic ${WP_AUTH}` },
                cache: "no-store",
            }
        );

        if (!res.ok) return [];

        const post = await res.json();
        // content.rendered에서 HTML 태그 제거 후 JSON 파싱
        const rawContent = post.content?.rendered || post.content?.raw || "[]";
        const cleanJson = rawContent
            .replace(/<[^>]*>/g, "")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, "&")
            .replace(/&#8220;/g, '"')
            .replace(/&#8221;/g, '"')
            .trim();

        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("[Subscribers] Error fetching subscribers:", e);
        return [];
    }
}

/**
 * WordPress에 구독자 목록 저장하기
 */
async function saveSubscribersData(subscribers: Subscriber[]): Promise<boolean> {
    try {
        const postId = await getSubscriberPostId();
        if (!postId) return false;

        const res = await fetch(
            `${WP_API_URL}/posts/${postId}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Basic ${WP_AUTH}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content: JSON.stringify(subscribers),
                }),
            }
        );

        return res.ok;
    } catch (e) {
        console.error("[Subscribers] Error saving subscribers:", e);
        return false;
    }
}

/**
 * 구독자 추가
 * autoVerify: true이면 즉시 인증 완료 (OAuth 로그인 사용자)
 */
export async function addSubscriber(
    email: string,
    tier: "free" | "premium" = "free",
    autoVerify: boolean = false
): Promise<{ success: boolean; message: string; verifyToken?: string }> {
    const subscribers = await getSubscribersData();

    // 중복 체크
    const existing = subscribers.find((s) => s.email.toLowerCase() === email.toLowerCase());
    if (existing) {
        if (existing.verified) {
            return { success: false, message: "이미 구독 중인 이메일입니다." };
        }
        // 미인증 상태 + autoVerify면 즉시 인증
        if (autoVerify) {
            existing.verified = true;
            await saveSubscribersData(subscribers);
            return { success: true, message: "구독이 완료되었습니다! 🎉" };
        }
        // 미인증 상태이면 토큰 재발급
        existing.verifyToken = generateToken();
        await saveSubscribersData(subscribers);
        return {
            success: true,
            message: "인증 이메일을 다시 발송했습니다.",
            verifyToken: existing.verifyToken,
        };
    }

    const verifyToken = generateToken();
    const unsubscribeToken = generateToken();

    const newSubscriber: Subscriber = {
        email: email.toLowerCase(),
        tier,
        verified: autoVerify, // OAuth 로그인 사용자는 즉시 인증
        verifyToken,
        subscribedAt: new Date().toISOString(),
        unsubscribeToken,
    };

    subscribers.push(newSubscriber);
    const saved = await saveSubscribersData(subscribers);

    if (!saved) {
        return { success: false, message: "구독 등록 중 오류가 발생했습니다." };
    }

    if (autoVerify) {
        return {
            success: true,
            message: "구독이 완료되었습니다! 🎉 새 글이 발행되면 이메일로 알려드릴게요.",
        };
    }

    return {
        success: true,
        message: "인증 이메일을 발송했습니다. 이메일을 확인해주세요.",
        verifyToken,
    };
}

/**
 * 이메일 인증 처리
 */
export async function verifySubscriber(
    token: string
): Promise<{ success: boolean; message: string; email?: string }> {
    const subscribers = await getSubscribersData();
    const subscriber = subscribers.find((s) => s.verifyToken === token);

    if (!subscriber) {
        return { success: false, message: "유효하지 않은 인증 토큰입니다." };
    }

    if (subscriber.verified) {
        return { success: true, message: "이미 인증된 이메일입니다.", email: subscriber.email };
    }

    subscriber.verified = true;
    await saveSubscribersData(subscribers);

    return { success: true, message: "이메일 인증이 완료되었습니다! 🎉", email: subscriber.email };
}

/**
 * 구독 해지
 */
export async function removeSubscriber(
    token: string
): Promise<{ success: boolean; message: string }> {
    const subscribers = await getSubscribersData();
    const index = subscribers.findIndex((s) => s.unsubscribeToken === token);

    if (index === -1) {
        return { success: false, message: "유효하지 않은 해지 토큰입니다." };
    }

    subscribers.splice(index, 1);
    await saveSubscribersData(subscribers);

    return { success: true, message: "구독이 해지되었습니다." };
}

/**
 * 인증된 구독자 목록 가져오기 (알림 발송용)
 */
export async function getVerifiedSubscribers(
    tier?: "free" | "premium"
): Promise<Subscriber[]> {
    const subscribers = await getSubscribersData();
    return subscribers.filter(
        (s) => s.verified && (!tier || s.tier === tier)
    );
}

/**
 * 전체 구독자 수 가져오기
 */
export async function getSubscriberCount(): Promise<number> {
    const subscribers = await getSubscribersData();
    return subscribers.filter((s) => s.verified).length;
}

/**
 * 특정 이메일의 구독 상태 확인
 */
export async function isSubscribed(email: string): Promise<boolean> {
    const subscribers = await getSubscribersData();
    return subscribers.some(
        (s) => s.email.toLowerCase() === email.toLowerCase() && s.verified
    );
}
