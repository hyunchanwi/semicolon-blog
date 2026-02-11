/**
 * Subscribe API Endpoint
 * GET: 구독 상태 확인
 * POST: 이메일 구독 등록 (로그인 사용자는 자동 인증)
 * DELETE: 구독 해지
 */

import { NextRequest, NextResponse } from "next/server";
import { addSubscriber, removeSubscriber, isSubscribed } from "@/lib/subscribers";
import { sendWelcomeEmail } from "@/lib/email";

// 이메일 유효성 검증
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * GET /api/subscribe?email=xxx
 * 구독 상태 확인
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");

        if (!email || !isValidEmail(email)) {
            return NextResponse.json(
                { subscribed: false },
                { status: 200 }
            );
        }

        const subscribed = await isSubscribed(email);
        return NextResponse.json({ subscribed }, { status: 200 });
    } catch (error) {
        console.error("[Subscribe] Status check error:", error);
        return NextResponse.json({ subscribed: false }, { status: 200 });
    }
}

/**
 * POST /api/subscribe
 * 이메일 구독 등록
 * body: { email, authenticated?: boolean }
 * authenticated=true면 이메일 인증 스킵 (OAuth 로그인 사용자)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, authenticated } = body;

        if (!email || !isValidEmail(email)) {
            return NextResponse.json(
                { success: false, message: "유효한 이메일 주소를 입력해주세요." },
                { status: 400 }
            );
        }

        // 로그인한 사용자 → 자동 인증 (이메일 인증 스킵)
        const autoVerify = authenticated === true;

        // 구독자 등록
        const result = await addSubscriber(email, "free", autoVerify);

        if (!result.success) {
            return NextResponse.json(
                { success: false, message: result.message },
                { status: 409 }
            );
        }

        // 자동 인증된 사용자에게 환영 이메일 발송 (백그라운드)
        if (autoVerify) {
            sendWelcomeEmail(email).catch((err) => {
                console.error("[Subscribe] Welcome email failed:", err);
            });
        }

        return NextResponse.json(
            { success: true, message: result.message },
            { status: 200 }
        );
    } catch (error) {
        console.error("[Subscribe] Error:", error);
        return NextResponse.json(
            { success: false, message: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/subscribe
 * 구독 해지
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json(
                { success: false, message: "해지 토큰이 필요합니다." },
                { status: 400 }
            );
        }

        const result = await removeSubscriber(token);
        return NextResponse.json(result, { status: result.success ? 200 : 404 });
    } catch (error) {
        console.error("[Unsubscribe] Error:", error);
        return NextResponse.json(
            { success: false, message: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
