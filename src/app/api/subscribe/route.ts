/**
 * Subscribe API Endpoint
 * POST: 이메일 구독 등록
 * DELETE: 구독 해지
 */

import { NextRequest, NextResponse } from "next/server";
import { addSubscriber, removeSubscriber } from "@/lib/subscribers";
import { sendVerificationEmail } from "@/lib/email";

// 이메일 유효성 검증
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * POST /api/subscribe
 * 이메일 구독 등록
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email || !isValidEmail(email)) {
            return NextResponse.json(
                { success: false, message: "유효한 이메일 주소를 입력해주세요." },
                { status: 400 }
            );
        }

        // 구독자 등록
        const result = await addSubscriber(email, "free");

        if (!result.success) {
            return NextResponse.json(
                { success: false, message: result.message },
                { status: 409 }
            );
        }

        // 인증 이메일 발송
        if (result.verifyToken) {
            const emailSent = await sendVerificationEmail(email, result.verifyToken);
            if (!emailSent) {
                return NextResponse.json(
                    { success: true, message: "구독 등록 완료! 인증 이메일이 발송 대기 중입니다." },
                    { status: 200 }
                );
            }
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
