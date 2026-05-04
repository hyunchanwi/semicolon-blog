import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({ 
        wpAuth: process.env.WP_AUTH,
        cronSecret: process.env.CRON_SECRET
    });
}
