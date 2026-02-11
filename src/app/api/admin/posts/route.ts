import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createPost } from "@/lib/wp-admin-api";
import { generateSummary } from "@/lib/summary";
import { isAdminEmail } from "@/lib/admin-auth";

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
