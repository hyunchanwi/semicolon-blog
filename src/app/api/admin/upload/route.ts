import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdminEmail } from "@/lib/admin-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import https from "https";

export const maxDuration = 60; // Allow up to 60 seconds for video uploads on Vercel

export const config = {
    api: {
        bodyParser: false, // Disabling bodyParser is necessary for NextRequest formData streaming of large files
    },
};

const WP_API_URL = "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

export async function POST(request: NextRequest) {
    try {
        // 1. Auth Check - MUST include authOptions in App Router
        const session = await getServerSession(authOptions);
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
        // Ensure filename is safe for HTTP headers (ASCII only)
        const originalName = file.name || `upload-${Date.now()}.jpg`;
        const extension = originalName.includes('.') ? originalName.split('.').pop() : 'jpg';
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const isVideo = file.type && file.type.startsWith("video/");
        const prefix = isVideo ? "vid-" : "img-";
        const filename = sanitizedName.length > extension!.length
            ? sanitizedName
            : `${prefix}${Date.now()}.${extension}`;

        const contentType = file.type || "image/jpeg";

        // 4. Upload to WordPress Media Library using native Node.js https to bypass Vercel undici/fetch HTTP2 issues
        return new Promise<NextResponse>((resolve) => {
            const url = new URL(`${WP_API_URL}/media`);
            const options = {
                hostname: url.hostname,
                path: url.pathname + url.search,
                method: 'POST',
                headers: {
                    "Authorization": `Basic ${WP_AUTH}`,
                    "Content-Type": contentType,
                    "Content-Disposition": `attachment; filename="${filename}"`,
                    "Content-Length": buffer.length
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const jsonData = JSON.parse(data);
                            resolve(NextResponse.json({
                                url: jsonData.source_url,
                                id: jsonData.id,
                            }));
                        } catch (e) {
                            console.error("Parse WP response error:", e);
                            resolve(NextResponse.json({ error: "Invalid WP response" }, { status: 500 }));
                        }
                    } else {
                        console.error("WP Upload Error:", res.statusCode, data);
                        resolve(NextResponse.json({ error: `WordPress upload failed: ${res.statusCode}` }, { status: 500 }));
                    }
                });
            });

            req.on('error', (e) => {
                console.error("Upload request error:", e);
                resolve(NextResponse.json({ error: e.message || "Upload request failed" }, { status: 500 }));
            });

            req.write(buffer);
            req.end();
        });

    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
    }
}
