/**
 * Email Service Library (Resend)
 * 구독자에게 이메일을 발송합니다.
 */

import { Resend } from "resend";
import { Subscriber } from "./subscribers";

let _resend: Resend | null = null;
function getResend(): Resend {
    if (!_resend) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            throw new Error("RESEND_API_KEY environment variable is not set");
        }
        _resend = new Resend(apiKey);
    }
    return _resend;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://semicolon-blog.vercel.app";
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev"; // Resend 기본 테스트 주소

/**
 * 구독 인증 이메일 발송
 */
export async function sendVerificationEmail(
    email: string,
    verifyToken: string
): Promise<boolean> {
    try {
        const verifyUrl = `${SITE_URL}/api/subscribe/verify?token=${verifyToken}`;

        const { error } = await getResend().emails.send({
            from: `Semicolon; <${FROM_EMAIL}>`,
            to: email,
            subject: "📬 Semicolon; 구독 인증을 완료해주세요",
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Pretendard',sans-serif;">
    <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:32px 24px;text-align:center;">
            <h1 style="color:white;margin:0;font-size:28px;font-weight:700;">Semicolon;</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">기술의 미래를 읽다</p>
        </div>
        
        <!-- Content -->
        <div style="padding:32px 24px;">
            <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">이메일 인증을 완료해주세요 ✉️</h2>
            <p style="color:#64748b;line-height:1.6;margin:0 0 24px;">
                Semicolon; 블로그를 구독해주셔서 감사합니다!<br>
                아래 버튼을 클릭하면 구독이 완료됩니다.
            </p>
            
            <!-- CTA Button -->
            <div style="text-align:center;margin:24px 0;">
                <a href="${verifyUrl}" 
                   style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:16px;">
                    ✅ 구독 인증하기
                </a>
            </div>
            
            <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:24px 0 0;">
                버튼이 작동하지 않으면 아래 링크를 복사해서 브라우저에 붙여넣기 해주세요:<br>
                <a href="${verifyUrl}" style="color:#3b82f6;word-break:break-all;">${verifyUrl}</a>
            </p>
        </div>
        
        <!-- Footer -->
        <div style="padding:16px 24px;background:#f8f9fa;text-align:center;">
            <p style="color:#94a3b8;font-size:12px;margin:0;">
                © 2026 Semicolon;. 이 이메일은 구독 인증을 위해 발송되었습니다.
            </p>
        </div>
    </div>
</body>
</html>`,
        });

        if (error) {
            console.error("[Email] Verification email failed:", error);
            return false;
        }

        console.log(`[Email] Verification email sent to ${email}`);
        return true;
    } catch (e) {
        console.error("[Email] Error sending verification email:", e);
        return false;
    }
}

/**
 * 환영 이메일 발송 (인증 완료 후)
 */
export async function sendWelcomeEmail(email: string): Promise<boolean> {
    try {
        const { error } = await getResend().emails.send({
            from: `Semicolon; <${FROM_EMAIL}>`,
            to: email,
            subject: "🎉 Semicolon; 구독을 환영합니다!",
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Pretendard',sans-serif;">
    <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:32px 24px;text-align:center;">
            <h1 style="color:white;margin:0;font-size:28px;font-weight:700;">Semicolon;</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">기술의 미래를 읽다</p>
        </div>
        <div style="padding:32px 24px;text-align:center;">
            <div style="font-size:48px;margin:0 0 16px;">🎉</div>
            <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 12px;">구독이 완료되었습니다!</h2>
            <p style="color:#64748b;line-height:1.6;margin:0 0 24px;">
                이제 새 글이 올라올 때마다 이메일로 알려드리겠습니다.<br>
                AI, 가젯, 소프트웨어의 최신 트렌드를 가장 먼저 만나보세요!
            </p>
            <a href="${SITE_URL}" 
               style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:16px;">
                블로그 방문하기 →
            </a>
        </div>
        <div style="padding:16px 24px;background:#f8f9fa;text-align:center;">
            <p style="color:#94a3b8;font-size:12px;margin:0;">© 2026 Semicolon;.</p>
        </div>
    </div>
</body>
</html>`,
        });

        if (error) {
            console.error("[Email] Welcome email failed:", error);
            return false;
        }
        return true;
    } catch (e) {
        console.error("[Email] Error sending welcome email:", e);
        return false;
    }
}

/**
 * 새 글 알림 이메일 발송 (구독자 전체에게)
 */
export async function sendNewPostNotification(
    subscribers: Subscriber[],
    post: { title: string; excerpt: string; url: string; imageUrl?: string }
): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const subscriber of subscribers) {
        try {
            const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${subscriber.unsubscribeToken}`;
            const imageSection = post.imageUrl
                ? `<img src="${post.imageUrl}" alt="${post.title}" style="width:100%;height:200px;object-fit:cover;" />`
                : `<div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);height:160px;display:flex;align-items:center;justify-content:center;">
                        <span style="color:white;font-size:36px;">📝</span>
                   </div>`;

            const { error } = await getResend().emails.send({
                from: `Semicolon; <${FROM_EMAIL}>`,
                to: subscriber.email,
                subject: `📢 새 글: ${post.title}`,
                html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Pretendard',sans-serif;">
    <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:20px 24px;text-align:center;">
            <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">Semicolon;</h1>
        </div>
        
        <!-- Image -->
        ${imageSection}
        
        <!-- Content -->
        <div style="padding:24px;">
            <p style="color:#64748b;font-size:13px;margin:0 0 8px;">새 글이 올라왔어요!</p>
            <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;line-height:1.4;">${post.title}</h2>
            <p style="color:#64748b;line-height:1.6;margin:0 0 20px;font-size:14px;">
                ${post.excerpt}
            </p>
            
            <a href="${post.url}" 
               style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:white;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:15px;">
                글 읽으러 가기 →
            </a>
        </div>
        
        <!-- Footer -->
        <div style="padding:16px 24px;background:#f8f9fa;text-align:center;">
            <p style="color:#94a3b8;font-size:11px;margin:0;">
                © 2026 Semicolon;. &nbsp;|&nbsp; 
                <a href="${unsubscribeUrl}" style="color:#94a3b8;">구독 해지</a>
            </p>
        </div>
    </div>
</body>
</html>`,
            });

            if (error) {
                console.error(`[Email] Failed to send to ${subscriber.email}:`, error);
                failed++;
            } else {
                sent++;
            }

            // Rate limiting: 100ms 간격
            await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (e) {
            console.error(`[Email] Error sending to ${subscriber.email}:`, e);
            failed++;
        }
    }

    console.log(`[Email] New post notification: ${sent} sent, ${failed} failed`);
    return { sent, failed };
}
