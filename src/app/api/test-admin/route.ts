import { NextResponse } from "next/server";
import { getAdminPostsPaginated } from "@/lib/wp-admin-api";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const wpAuth = process.env.WP_AUTH || "";
        const wpAuthLength = wpAuth.length;
        const res = await getAdminPostsPaginated(1, 10, null);
        return NextResponse.json({ success: true, count: res.posts.length, wpAuthLength });
    } catch(e: any) {
        return NextResponse.json({ 
            success: false, 
            error: e.message,
            wpAuthExists: !!process.env.WP_AUTH,
            wpAuthLength: (process.env.WP_AUTH || "").length
        });
    }
}
