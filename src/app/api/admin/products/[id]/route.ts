
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdminEmail } from "@/lib/admin-auth";
import { updateProduct, deleteProduct, getProduct } from "@/lib/coupang";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession();
        if (!session || !isAdminEmail(session.user?.email)) {
            // For GET, maybe allowed? But let's secure it.
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const id = parseInt(params.id);
        const product = await getProduct(id);

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, product });
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession();
        if (!session || !isAdminEmail(session.user?.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const id = parseInt(params.id);
        const body = await request.json();

        // Validation
        if (!body.name || !body.affiliateUrl) {
            return NextResponse.json(
                { success: false, error: "상품명과 쿠팡 링크는 필수입니다" },
                { status: 400 }
            );
        }

        const updatedProduct = await updateProduct(id, {
            name: body.name,
            price: body.price || 0,
            imageUrl: body.imageUrl || "",
            affiliateUrl: body.affiliateUrl,
            category: body.category || "general",
            description: body.description || ""
        });

        if (!updatedProduct) {
            return NextResponse.json(
                { success: false, error: "상품 수정에 실패했습니다" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, product: updatedProduct });
    } catch (error) {
        console.error("[API] Product PUT error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession();
        if (!session || !isAdminEmail(session.user?.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const id = parseInt(params.id);
        const success = await deleteProduct(id);

        if (!success) {
            return NextResponse.json(
                { success: false, error: "상품 삭제에 실패했습니다" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[API] Product DELETE error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
