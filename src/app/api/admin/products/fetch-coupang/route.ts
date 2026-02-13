
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdminEmail } from "@/lib/admin-auth";
import * as cheerio from "cheerio";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        // Build-time check for admin auth fails in build but fine in runtime if configured
        // But let's keep it safe.
        // Actually, let's allow this to be public for now or same admin check?
        // Admin check is safer.
        const session = await getServerSession();
        if (!session || !isAdminEmail(session.user?.email)) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { url } = await request.json();

        if (!url) {
            return NextResponse.json(
                { error: "URL is required" },
                { status: 400 }
            );
        }

        console.log(`[FetchCoupang] Fetching: ${url}`);

        // Coupang blocks requests without proper User-Agent
        // Added more headers to mimic real browser
        const headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
            "Referer": "https://www.coupang.com/",
            "Sec-Ch-Ua": '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"macOS"',
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
            "Cache-Control": "max-age=0",
        };

        // Handle Short Links (link.coupang.com) explicitly to get final URL cookies maybe?
        // Fetch follows redirects by default.
        const res = await fetch(url, { headers, redirect: 'follow' });

        if (!res.ok) {
            if (res.status === 403 || res.status === 429) {
                return NextResponse.json({ error: "쿠팡 접근이 차단되었습니다 (403/429). 수동 입력을 권장합니다." }, { status: 403 });
            }
            throw new Error(`Failed to fetch page: ${res.status}`);
        }

        const html = await res.text();
        const $ = cheerio.load(html);

        // Open Graph Parsing
        const title = $('meta[property="og:title"]').attr('content') || $('title').text() || "";
        const image = $('meta[property="og:image"]').attr('content') || "";
        const description = $('meta[property="og:description"]').attr('content') || "";

        // Price Parsing (Fragile, might change)
        // Coupang specific classes: .total-price > strong, .prod-sale-price, etc.
        let price = 0;

        // Strategy 1: Look for LD-JSON (Most reliable if available)
        try {
            const jsonLd = $('script[type="application/ld+json"]').html();
            if (jsonLd) {
                const data = JSON.parse(jsonLd);
                // Coupang LD-JSON structure varies, usually Product type
                // data can be array or object
                const product = Array.isArray(data) ? data.find(d => d['@type'] === 'Product') : (data['@type'] === 'Product' ? data : null);

                if (product && product.offers) {
                    const priceVal = product.offers.price || product.offers.lowPrice || product.offers.highPrice;
                    if (priceVal) price = parseInt(priceVal);
                }
            }
        } catch (e) {
            console.warn("LD-JSON parse failed", e);
        }

        // Strategy 2: CSS Selectors if LD-JSON failed
        if (!price) {
            const priceText = $('.total-price > strong').text() ||
                $('.prod-sale-price .total-price > strong').text() ||
                $('.prod-price .total-price > strong').text();

            if (priceText) {
                price = parseInt(priceText.replace(/[^0-9]/g, ""));
            }
        }

        console.log(`[FetchCoupang] Success: ${title.slice(0, 20)}... / ${price} won`);

        // Generate AI Content
        let aiData = { title: title.trim(), content: description.trim() };
        try {
            const { generateProductContent } = await import("@/lib/gemini");
            // Use stripped title/desc for better AI context
            const cleanTitle = title.trim();
            const cleanDesc = description.trim().slice(0, 200); // Limit context size

            console.log("[FetchCoupang] Generating AI content...");
            const aiResult = await generateProductContent(cleanTitle, price, cleanDesc);

            if (aiResult.title) aiData.title = aiResult.title;
            if (aiResult.content) aiData.content = aiResult.content;

        } catch (e) {
            console.error("[FetchCoupang] AI Generation failed, using raw data", e);
        }

        return NextResponse.json({
            success: true,
            data: {
                title: aiData.title, // AI generated title or original
                imageUrl: image,
                price: price,
                description: aiData.content, // AI generated content (bullet points) or original
                originalTitle: title.trim() // Keep original for reference if needed
            }
        });

    } catch (error) {
        console.error("[FetchCoupang] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch coupang info" },
            { status: 500 }
        );
    }
}
