/**
 * New Post Notification Cron Endpoint
 * 크론에서 글 발행 후 호출하여 구독자에게 알림을 보냅니다.
 * POST /api/cron/notify
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedSubscribers } from "@/lib/subscribers";
import { sendNewPostNotification } from "@/lib/email";

const CRON_SECRET = process.env.CRON_SECRET;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://semicolon-blog.vercel.app";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        // 인증 체크
        const authHeader = request.headers.get("authorization");
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get("secret") || authHeader?.replace("Bearer ", "");

        if (CRON_SECRET && secret !== CRON_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { title, excerpt, slug, imageUrl } = body;

        if (!title || !slug) {
            return NextResponse.json(
                { error: "title and slug are required" },
                { status: 400 }
            );
        }

        // 인증된 구독자 목록 가져오기
        const subscribers = await getVerifiedSubscribers();

        if (subscribers.length === 0) {
            console.log("[Notify] No subscribers to notify");
            return NextResponse.json({
                success: true,
                message: "No subscribers to notify",
                sent: 0,
            });
        }

        console.log(`[Notify] Sending notification to ${subscribers.length} subscribers...`);

        // 이메일 발송
        const postUrl = `${SITE_URL}/blog/${slug}`;
        const result = await sendNewPostNotification(subscribers, {
            title,
            excerpt: excerpt || "",
            url: postUrl,
            imageUrl,
        });

        return NextResponse.json({
            success: true,
            ...result,
            totalSubscribers: subscribers.length,
        });
    } catch (error) {
        console.error("[Notify] Error:", error);
        return NextResponse.json(
            { error: "Failed to send notifications" },
            { status: 500 }
        );
    }
}
