/**
 * Email Verification Endpoint
 * GET /api/subscribe/verify?token=xxx
 */

import { NextRequest, NextResponse } from "next/server";
import { verifySubscriber } from "@/lib/subscribers";
import { sendWelcomeEmail } from "@/lib/email";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://semicolon-blog.vercel.app";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
        return NextResponse.redirect(`${SITE_URL}?subscribe=error&msg=invalid_token`);
    }

    const result = await verifySubscriber(token);

    if (result.success) {
        // 인증 성공 시 환영 이메일 발송 (백그라운드)
        if (result.email) {
            sendWelcomeEmail(result.email).catch((err) => {
                console.error("[Verify] Failed to send welcome email:", err);
            });
        }

        return NextResponse.redirect(`${SITE_URL}?subscribe=success`);
    }

    return NextResponse.redirect(`${SITE_URL}?subscribe=error&msg=invalid_token`);
}
