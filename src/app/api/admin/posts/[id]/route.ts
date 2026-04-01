import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { updatePost, deletePost } from "@/lib/wp-admin-api";
import { generateSummary } from "@/lib/summary";
import { isAdminEmail } from "@/lib/admin-auth";
import { googlePublishUrl } from "@/lib/google-indexing";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


// Update post
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
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

        // Google Indexing (Only if published)
        if (post.status === 'publish') {
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semicolonittech.com";
            // post.slug might be missing in type definition but present in runtime
            const postSlug = (post as any).slug || post.link.split('/').filter((s: string) => s).pop();
            const publicUrl = `${siteUrl}/blog/${postSlug}`;

            console.log(`[Admin] 📡 Indexing: ${publicUrl}`);
            await googlePublishUrl(publicUrl).catch(e => console.error(e));
        }

        // Trigger Cache Revalidation
        (revalidateTag as any)("posts");
        revalidatePath("/blog", "page");
        revalidatePath("/", "layout");
        revalidatePath("/admin/posts");

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
        const session = await getServerSession(authOptions);
        if (!session || !isAdminEmail(session.user?.email)) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const postId = parseInt(id, 10);

        await deletePost(postId);

        // Trigger Cache Revalidation
        (revalidateTag as any)("posts");
        revalidatePath("/blog", "page");
        revalidatePath("/", "layout");
        revalidatePath("/admin/posts");

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
        const session = await getServerSession(authOptions);
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

        // Trigger Cache Revalidation
        (revalidateTag as any)("posts");
        revalidatePath("/blog", "page");
        revalidatePath("/", "layout");
        revalidatePath("/admin/posts");

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
