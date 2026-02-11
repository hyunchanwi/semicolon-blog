
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { updatePost } from "@/lib/wp-admin-api";
import { isAdminEmail } from "@/lib/admin-auth";

// status: 'publish' | 'draft' | 'private'
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession();
        if (!session || !isAdminEmail(session.user?.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const id = (await params).id;
        const { status } = await request.json();

        if (!status || !['publish', 'draft', 'private', 'pending'].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const result = await updatePost(parseInt(id), {
            status: status as 'publish' | 'draft' | 'private'
        });

        return NextResponse.json({ success: true, post: result });
    } catch (error) {
        console.error("Update status error:", error);
        return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }
}
