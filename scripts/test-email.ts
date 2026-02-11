/**
 * 이메일 발송 테스트 스크립트
 */
import 'dotenv/config';
import { Resend } from 'resend';

async function testEmail() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error("❌ RESEND_API_KEY not set");
        return;
    }

    console.log("📧 Testing Resend email...");
    console.log(`   API Key: ${apiKey.slice(0, 10)}...`);

    const resend = new Resend(apiKey);

    try {
        const { data, error } = await resend.emails.send({
            from: 'Semicolon; <onboarding@resend.dev>',
            to: 'hyunchan09@gmail.com',
            subject: '✅ Semicolon; 이메일 테스트 성공!',
            html: `
<div style="max-width:500px;margin:20px auto;padding:24px;background:white;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);font-family:-apple-system,sans-serif;">
    <div style="text-align:center;padding:20px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:8px;margin-bottom:20px;">
        <h1 style="color:white;margin:0;font-size:24px;">Semicolon;</h1>
    </div>
    <h2 style="color:#1a1a1a;">🎉 이메일 발송 테스트 성공!</h2>
    <p style="color:#64748b;line-height:1.6;">
        Resend 이메일 서비스가 정상적으로 작동합니다.<br>
        구독 알림 시스템이 준비되었습니다.
    </p>
    <p style="color:#94a3b8;font-size:12px;">
        발송 시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
    </p>
</div>`,
        });

        if (error) {
            console.error("❌ Failed:", error);
        } else {
            console.log("✅ Email sent successfully!");
            console.log("   ID:", data?.id);
        }
    } catch (e) {
        console.error("❌ Error:", e);
    }
}

testEmail();
