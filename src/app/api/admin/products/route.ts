import { NextRequest, NextResponse } from "next/server";
import { getProducts, createProduct } from "@/lib/coupang";

// GET: 상품 목록 조회
export async function GET() {
    try {
        const products = await getProducts('any');
        return NextResponse.json({ success: true, products });
    } catch (error) {
        console.error("[API] Products GET error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}

// POST: 새 상품 등록
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // 필수 필드 검증
        if (!body.name || !body.affiliateUrl) {
            return NextResponse.json(
                { success: false, error: "상품명과 쿠팡 링크는 필수입니다" },
                { status: 400 }
            );
        }

        const product = await createProduct({
            name: body.name,
            price: body.price || 0,
            imageUrl: body.imageUrl || "",
            affiliateUrl: body.affiliateUrl,
            category: body.category || "general",
            description: body.description || ""
        });

        if (!product) {
            return NextResponse.json(
                { success: false, error: "상품 등록에 실패했습니다" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, product });
    } catch (error) {
        console.error("[API] Products POST error:", error);
        return NextResponse.json(
            { success: false, error: "Server error" },
            { status: 500 }
        );
    }
}
