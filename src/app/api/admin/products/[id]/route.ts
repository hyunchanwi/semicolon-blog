import { NextRequest, NextResponse } from "next/server";
import { getProduct, updateProduct, deleteProduct } from "@/lib/coupang";

interface RouteContext {
    params: Promise<{ id: string }>;
}

// GET: 단일 상품 조회
export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;
        const product = await getProduct(parseInt(id));

        if (!product) {
            return NextResponse.json(
                { success: false, error: "상품을 찾을 수 없습니다" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, product });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Server error" },
            { status: 500 }
        );
    }
}

// PUT: 상품 수정
export async function PUT(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;
        const body = await request.json();

        const product = await updateProduct(parseInt(id), body);

        if (!product) {
            return NextResponse.json(
                { success: false, error: "상품 수정에 실패했습니다" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, product });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Server error" },
            { status: 500 }
        );
    }
}

// DELETE: 상품 삭제
export async function DELETE(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;
        const success = await deleteProduct(parseInt(id));

        if (!success) {
            return NextResponse.json(
                { success: false, error: "상품 삭제에 실패했습니다" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Server error" },
            { status: 500 }
        );
    }
}
