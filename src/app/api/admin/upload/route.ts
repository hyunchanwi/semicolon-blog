import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdminEmail } from "@/lib/admin-auth";
import { Agent, fetch as undiciFetch } from "undici";
const _http1Agent = new Agent({ allowH2: false });
const wpFetch = (url: string, opts: any = {}) => undiciFetch(url, { ...opts, dispatcher: _http1Agent }) as any;

const WP_API_URL = "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = Buffer.from("hyunchan09@gmail.com:wsbh 3VHB YwU9 EUap jLq5 QAWT").toString("base64");

export async function POST(request: NextRequest) {
    try {
        // 1. Auth Check
        const session = await getServerSession();
        if (!session || !isAdminEmail(session.user?.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse FormData
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // 3. Prepare upload to WordPress
        const wpFormData = new FormData();
        wpFormData.append("file", file);

        // 4. Upload to WordPress Media Library
        const res = await wpFetch(`${WP_API_URL}/media`, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${WP_AUTH}`,
                // Note: Do NOT set Content-Type header here, let fetch set it with boundary
            },
            body: wpFormData,
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("WP Upload Error:", errorText);
            throw new Error(`WordPress upload failed: ${res.statusText}`);
        }

        const data = await res.json();

        // 5. Return the image URL
        return NextResponse.json({
            url: data.source_url, // The full URL of the uploaded image
            id: data.id,
        });

    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
    }
}
