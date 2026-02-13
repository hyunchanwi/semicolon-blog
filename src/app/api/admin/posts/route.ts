import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createPost } from "@/lib/wp-admin-api";
import { stripHtml } from "@/lib/wp-api";
import { generateSummary } from "@/lib/summary";
import { isAdminEmail } from "@/lib/admin-auth";
import { googlePublishUrl } from "@/lib/google-indexing";

export async function POST(request: NextRequest) {
    try {
        // Check if user is admin
        const session = await getServerSession();
        if (!session || !isAdminEmail(session.user?.email)) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { title, content, excerpt, status, categories, featured_media } = body;

        if (!title || !content) {
            return NextResponse.json(
                { error: "제목과 내용은 필수입니다" },
                { status: 400 }
            );
        }

        // AI 요약 자동 생성
        let aiSummary = '';
        if (status === 'publish') {
            console.log('[Post] Generating AI summary...');
            aiSummary = await generateSummary(content);
        }

        const post = await createPost({
            title,
            content,
            excerpt,
            status: status || "draft",
            categories,
            featured_media,
            meta: aiSummary ? { ai_summary: aiSummary } : undefined,
        });

        // Google Indexing & Email Notification (Only if published)
        if (post.status === 'publish') {
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semicolonittech.com";
            // post.slug might be missing in type definition but present in runtime
            const postSlug = (post as any).slug || post.link.split('/').filter((s: string) => s).pop();
            const publicUrl = `${siteUrl}/blog/${postSlug}`;

            console.log(`[Admin] 📡 Indexing: ${publicUrl}`);
            googlePublishUrl(publicUrl).catch(e => console.error(e));

            // Send Email Notification
            // Need to fetch image URL if featured_media is set
            let imageUrl = '';
            if (featured_media) {
                try {
                    // media fetching is async and might be complex to do here without extra API call.
                    // For now, rely on what we have or skip image if not easily available.
                    // Actually, createPost might return embedded media if we ask? 
                    // But standard WP API response for create includes 'featured_media' ID, not full object unless _embed.
                    // Let's try to fetch media detail or just send without image for speed, 
                    // OR if client sent us the URL in body? Client only sends ID usually.

                    // Client side usually knows the URL. But here we are server.
                    // Let's fetch media info quickly.
                    const { getMedia } = await import("@/lib/wp-api"); // Dynamic import to avoid cycle if any
                    const media = await getMedia(featured_media);
                    if (media?.source_url) {
                        imageUrl = media.source_url;
                    }
                } catch (e) {
                    console.error("[Admin] Failed to fetch media for notification:", e);
                }
            }

            const { getVerifiedSubscribers } = await import("@/lib/subscribers");
            const { sendNewPostNotification } = await import("@/lib/email");

            getVerifiedSubscribers().then(async (subscribers) => {
                if (subscribers.length > 0) {
                    console.log(`[Admin] 📧 Sending notification to ${subscribers.length} subscribers...`);
                    await sendNewPostNotification(subscribers, {
                        title: post.title.rendered,
                        excerpt: stripHtml(post.excerpt.rendered).slice(0, 200) + "...",
                        url: publicUrl,
                        imageUrl: imageUrl || undefined
                    });
                }
            }).catch(e => console.error("[Admin] Notification failed:", e));
        }

        return NextResponse.json({ success: true, post });
    } catch (error) {
        const message = error instanceof Error ? error.message : "글 생성 실패";
        console.error("Create post error:", error);
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
