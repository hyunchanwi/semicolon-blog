
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdminEmail } from "@/lib/admin-auth";
import { generateProductContent } from "@/lib/gemini";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        // Allow public access for now or strictly check admin? 
        // Let's strictly check admin as it consumes API quota.
        if (!session || !isAdminEmail(session.user?.email)) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { productName } = await request.json();

        if (!productName) {
            return NextResponse.json(
                { error: "Product name is required" },
                { status: 400 }
            );
        }

        console.log(`[GenerateAI] Generating content for: ${productName}`);

        // Call Gemini with just the product name (and maybe a hint that description is empty)
        // We'll pass empty string for description and 0 for price as they are unknown yet.
        const aiResult = await generateProductContent(productName, 0, "사용자가 상품명만 입력했습니다. 이 상품에 대한 일반적인 특징을 바탕으로 작성해주세요.");

        return NextResponse.json({
            success: true,
            data: {
                title: aiResult.title,
                content: aiResult.content
            }
        });

    } catch (error) {
        console.error("[GenerateAI] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate content" },
            { status: 500 }
        );
    }
}
