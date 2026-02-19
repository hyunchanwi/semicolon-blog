import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdminEmail } from "@/lib/admin-auth";
import { Agent, fetch as undiciFetch } from "undici";
const _http1Agent = new Agent({ allowH2: false });
const wpFetch = (url: string, opts: any = {}) => undiciFetch(url, { ...opts, dispatcher: _http1Agent }) as any;

const WP_API_URL = "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

export async function POST(request: NextRequest) {
    try {
        // 1. Auth Check
        const session = await getServerSession();
        if (!session || !isAdminEmail(session.user?.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse FormData from Request
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // 3. Prepare Buffer for direct binary upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const filename = file.name || `upload-${Date.now()}.jpg`;
        const contentType = file.type || "image/jpeg";

        // 4. Upload to WordPress Media Library (Direct Binary)
        // FormData with undici often fails on Hostinger due to boundary/header issues.
        // Direct binary upload with Content-Disposition is more reliable.
        const res = await wpFetch(`${WP_API_URL}/media`, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${WP_AUTH}`,
                "Content-Type": contentType,
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
            body: buffer,
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
