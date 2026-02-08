import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { updatePost, deletePost } from "@/lib/wp-admin-api";
import { generateSummary } from "@/lib/summary";
import { isAdminEmail } from "@/lib/admin-auth";

// Update post
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession();
        if (!session || !isAdminEmail(session.user?.email)) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const postId = parseInt(id, 10);
        const body = await request.json();
        const { title, content, excerpt, status, categories, featured_media, regenerateSummary } = body;

        // AI 요약 생성 (발행 시 또는 명시적 요청 시)
        let meta: Record<string, string> | undefined;
        if (regenerateSummary || status === 'publish') {
            console.log('[Post] Generating AI summary for update...');
            const aiSummary = await generateSummary(content);
            if (aiSummary) {
                meta = { ai_summary: aiSummary };
            }
        }

        const post = await updatePost(postId, {
            title,
            content,
            excerpt,
            status,
            categories,
            featured_media,
            meta,
        });

        return NextResponse.json({ success: true, post });
    } catch (error) {
        const message = error instanceof Error ? error.message : "글 수정 실패";
        console.error("Update post error:", error);
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}

// Delete post
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession();
        if (!session || !isAdminEmail(session.user?.email)) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const postId = parseInt(id, 10);

        await deletePost(postId);

        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "글 삭제 실패";
        console.error("Delete post error:", error);
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}

// Quick update (category only, no summary regeneration)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession();
        if (!session || !isAdminEmail(session.user?.email)) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const postId = parseInt(id, 10);
        const body = await request.json();
        const { categories } = body;

        // Only update categories, no summary regeneration
        const post = await updatePost(postId, { categories });

        return NextResponse.json({ success: true, post });
    } catch (error) {
        const message = error instanceof Error ? error.message : "카테고리 변경 실패";
        console.error("Patch post error:", error);
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
