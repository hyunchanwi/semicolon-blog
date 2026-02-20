import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Ensure the Edge Runtime has access to these securely
const WP_API_URL = "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

export async function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || '';

    // Redirect www to non-www
    if (hostname.startsWith('www.')) {
        const newUrl = new URL(request.url);
        newUrl.hostname = hostname.replace('www.', '');
        return NextResponse.redirect(newUrl, 301);
    }

    // Intercept Large Media Upload Proxy Route
    if (request.nextUrl.pathname.startsWith('/api/proxy-wp-media')) {
        // 1. Authenticate Request at the Edge
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
        // Check if token exists and belongs to an admin
        const allowedEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim());
        if (!token?.email || !allowedEmails.includes(token.email)) {
            return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { 'content-type': 'application/json' } });
        }

        // 2. Prepare Proxy Rewrite target
        const wpUrl = new URL(`${WP_API_URL}/media`);

        // 3. Clone request headers and inject WordPress Authentication
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('Authorization', `Basic ${WP_AUTH}`);

        // The frontend will send the exact Content-Type and custom X-Filename header
        const filename = request.headers.get('X-Filename') || `vid-${Date.now()}.mp4`;
        const sanitizedName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '');
        requestHeaders.set('Content-Disposition', `attachment; filename="${sanitizedName}"`);

        // Prevent body parsing at Edge, just forward the raw stream
        return NextResponse.rewrite(wpUrl, {
            request: {
                headers: requestHeaders,
            },
        });
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes EXCEPT our proxy)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api/(?!proxy-wp-media)|_next/static|_next/image|favicon.ico).*)',
    ],
};
