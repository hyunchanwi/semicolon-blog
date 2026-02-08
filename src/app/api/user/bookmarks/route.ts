import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { updateUser, getPostById, getUserById, getUserByEmail, createWPUser, WPUser } from "@/lib/wp-admin-api";
import { getFeaturedImageUrl } from "@/lib/wp-api";

// 사용자 WP ID 가져오기 (세션 우선, 없으면 이메일로 검색/생성)
async function ensureWPUser(session: any): Promise<WPUser | null> {
    const email = session.user?.email;
    const name = session.user?.name || "Member";
    const wpIdFromSession = (session.user as any)?.wpId;

    console.log('[ensureWPUser] Email:', email, 'Session wpId:', wpIdFromSession);

    // 1. 세션에 wpId가 있으면 직접 조회
    if (wpIdFromSession) {
        const user = await getUserById(wpIdFromSession);
        if (user) {
            console.log('[ensureWPUser] Found via ID:', user.id, user.email);
            return user;
        }
        console.log('[ensureWPUser] ID lookup failed, trying email');
    }

    // 2. 이메일로 검색
    if (email) {
        let user = await getUserByEmail(email);

        // 3. 없으면 새로 생성
        if (!user) {
            console.log('[ensureWPUser] Creating new user for:', email);
            try {
                user = await createWPUser(email, name);
                console.log('[ensureWPUser] Created new user:', user.id);
            } catch (e) {
                console.error('[ensureWPUser] Failed to create user:', e);
                return null;
            }
        }

        return user;
    }

    return null;
}

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    console.log('[BOOKMARK GET] Session:', session.user.email, 'wpId:', (session.user as any)?.wpId);

    try {
        const wpUser = await ensureWPUser(session);

        if (!wpUser) {
            console.log('[BOOKMARK GET] No WP user found');
            return NextResponse.json({
                error: "사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.",
                bookmarks: []
            });
        }

        console.log('[BOOKMARK GET] Using WP User:', wpUser.id, wpUser.email);

        let storedData: any = {};
        try {
            if (wpUser.description && wpUser.description.trim().startsWith("{")) {
                storedData = JSON.parse(wpUser.description);
            } else {
                storedData = { bio: wpUser.description, bookmarks: [] };
            }
        } catch (e) {
            storedData = { bio: wpUser.description, bookmarks: [] };
        }

        const bookmarkIds = Array.isArray(storedData.bookmarks) ? storedData.bookmarks : [];
        console.log('[BOOKMARK GET] User ID', wpUser.id, 'has bookmarks:', bookmarkIds);

        const posts = await Promise.all(
            bookmarkIds.map((id: number) => getPostById(id).catch(() => null))
        );

        const validPosts = posts
            .filter(p => p !== null)
            .map(p => ({
                id: p.id,
                title: p.title.rendered,
                slug: p.slug,
                date: p.date,
                thumbnail: getFeaturedImageUrl(p)
            }));

        return NextResponse.json({
            bookmarks: validPosts,
            userId: wpUser.id  // 디버깅용: 어떤 사용자의 북마크인지 확인
        });

    } catch (e: any) {
        console.error('[BOOKMARK GET] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { postId, action } = await req.json();
    if (!postId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    console.log('[BOOKMARK POST] Session:', session.user.email, 'wpId:', (session.user as any)?.wpId, 'Action:', action, 'PostID:', postId);

    try {
        const wpUser = await ensureWPUser(session);

        if (!wpUser) {
            console.log('[BOOKMARK POST] No WP user found');
            return NextResponse.json({
                error: "사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요."
            }, { status: 404 });
        }

        console.log('[BOOKMARK POST] Using WP User:', wpUser.id, wpUser.email);

        let storedData: any = {};
        try {
            if (wpUser.description && wpUser.description.trim().startsWith("{")) {
                storedData = JSON.parse(wpUser.description);
            } else {
                storedData = { bio: wpUser.description, bookmarks: [] };
            }
        } catch (e) {
            storedData = { bio: wpUser.description, bookmarks: [] };
        }

        if (!Array.isArray(storedData.bookmarks)) {
            storedData.bookmarks = [];
        }

        const idInt = parseInt(postId);
        console.log('[BOOKMARK POST] Before:', storedData.bookmarks);

        if (action === "add") {
            if (!storedData.bookmarks.includes(idInt)) {
                storedData.bookmarks.push(idInt);
            }
        } else if (action === "remove") {
            storedData.bookmarks = storedData.bookmarks.filter((id: number) => id !== idInt);
        }

        console.log('[BOOKMARK POST] After:', storedData.bookmarks);

        await updateUser(wpUser.id, {
            description: JSON.stringify(storedData)
        });

        console.log('[BOOKMARK POST] Saved to WP User ID:', wpUser.id);

        return NextResponse.json({
            success: true,
            bookmarks: storedData.bookmarks,
            userId: wpUser.id  // 디버깅용
        });

    } catch (e: any) {
        console.error("[BOOKMARK POST] Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
