/**
 * WordPress Admin API Client
 * 관리자용 CRUD 작업 (글 생성/수정/삭제)
 */

const WP_API_URL = "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const WP_AUTH = Buffer.from("hyunchan09@gmail.com:wsbh 3VHB YwU9 EUap jLq5 QAWT").toString("base64");

export interface CreatePostData {
    title: string;
    content: string;
    excerpt?: string;
    status: "publish" | "draft" | "private";
    categories?: number[];
    featured_media?: number;
    meta?: Record<string, string>;
    // Rank Math SEO fields
    rank_math_title?: string;
    rank_math_description?: string;
    rank_math_focus_keyword?: string;
}

export interface UpdatePostData extends Partial<CreatePostData> {
    id: number;
}

// 글 생성
export async function createPost(data: CreatePostData) {
    // Rank Math SEO 필드를 meta에 병합
    const postData = {
        ...data,
        meta: {
            ...data.meta,
            // Rank Math SEO 필드
            ...(data.rank_math_title && { rank_math_title: data.rank_math_title }),
            ...(data.rank_math_description && { rank_math_description: data.rank_math_description }),
            ...(data.rank_math_focus_keyword && { rank_math_focus_keyword: data.rank_math_focus_keyword }),
        },
    };

    const res = await fetch(`${WP_API_URL}/posts`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${WP_AUTH}`,
        },
        body: JSON.stringify(postData),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create post");
    }

    return res.json();
}

// 글 수정
export async function updatePost(id: number, data: Partial<CreatePostData>) {
    const res = await fetch(`${WP_API_URL}/posts/${id}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${WP_AUTH}`,
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update post");
    }

    return res.json();
}

// 글 삭제
export async function deletePost(id: number) {
    const res = await fetch(`${WP_API_URL}/posts/${id}?force=true`, {
        method: "DELETE",
        headers: {
            "Authorization": `Basic ${WP_AUTH}`,
        },
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete post");
    }

    return res.json();
}

// 단일 글 가져오기 (편집용)
export async function getPostById(id: number) {
    const res = await fetch(
        `${WP_API_URL}/posts/${id}?_embed`,
        {
            headers: {
                "Authorization": `Basic ${WP_AUTH}`,
            },
            next: { revalidate: 0 }, // 항상 최신 데이터
        }
    );

    if (!res.ok) {
        return null;
    }

    return res.json();
}

// 관리자용 글 목록 가져오기 (비공개, 예약 등 모든 상태 포함)
export async function getAdminPosts(perPage: number = 50, categoryId: number | null = null) {
    let url = `${WP_API_URL}/posts?per_page=${perPage}&status=any&_embed`;

    if (categoryId) {
        url += `&categories=${categoryId}`;
    }

    const res = await fetch(url, {
        headers: {
            "Authorization": `Basic ${WP_AUTH}`,
        },
        cache: 'no-store'
    });

    if (!res.ok) {
        throw new Error("Failed to fetch admin posts");
    }

    return res.json();
}

// 카테고리 수정
export async function updateCategory(id: number, data: any) {
    const res = await fetch(`${WP_API_URL}/categories/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${WP_AUTH}`,
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update category");
    }

    return res.json();
}

// 카테고리 삭제
export async function deleteCategory(id: number) {
    const res = await fetch(`${WP_API_URL}/categories/${id}?force=true`, {
        method: "DELETE",
        headers: {
            "Authorization": `Basic ${WP_AUTH}`,
        },
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete category");
    }

    return res.json();
}

// ==========================================
// 사용자 관리 (User Management)
// ==========================================

export interface WPUser {
    id: number;
    email: string;
    username: string;
    name: string;
    meta?: Record<string, any>;
    description?: string;
}

// ID로 사용자 찾기 (가장 확실한 방법)
export async function getUserById(userId: number): Promise<WPUser | null> {
    console.log('[getUserById] Fetching user ID:', userId);

    const res = await fetch(`${WP_API_URL}/users/${userId}?context=edit`, {
        headers: {
            "Authorization": `Basic ${WP_AUTH}`
        },
        cache: 'no-store'
    });

    if (res.ok) {
        const user = await res.json();
        console.log('[getUserById] Found user:', user.id, user.email);
        return user;
    }

    console.log('[getUserById] User not found for ID:', userId);
    return null;
}

// 이메일로 사용자 찾기
export async function getUserByEmail(email: string): Promise<WPUser | null> {
    console.log('[getUserByEmail] Searching for:', email);

    // WordPress API의 email 파라미터는 정확한 매칭이 안 될 수 있음
    // search 파라미터로 먼저 시도
    const searchRes = await fetch(`${WP_API_URL}/users?search=${encodeURIComponent(email)}&context=edit`, {
        headers: {
            "Authorization": `Basic ${WP_AUTH}`
        },
        cache: 'no-store'
    });

    if (searchRes.ok) {
        const users = await searchRes.json();
        console.log('[getUserByEmail] Search found', users.length, 'users');

        // 정확한 이메일 매칭 확인
        const exactMatch = users.find((u: WPUser) => u.email.toLowerCase() === email.toLowerCase());
        if (exactMatch) {
            console.log('[getUserByEmail] Exact match found:', exactMatch.id, exactMatch.email);
            return exactMatch;
        }

        console.log('[getUserByEmail] No exact match for', email);
    }

    console.log('[getUserByEmail] User not found for', email);
    return null;
}

// 사용자 생성
export async function createWPUser(email: string, name: string): Promise<WPUser> {
    // Generate a random password since we use SSO
    const password = Math.random().toString(36).slice(-10) + "!!A1";

    const res = await fetch(`${WP_API_URL}/users`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${WP_AUTH}`,
        },
        body: JSON.stringify({
            username: email,
            email: email,
            name: name,
            password: password,
            roles: ["subscriber"]
        }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create WP user");
    }

    return res.json();
}

// 사용자 메타 업데이트 (북마크 저장용 - Meta 방식)
export async function updateUserMeta(userId: number, key: string, value: any) {
    const res = await fetch(`${WP_API_URL}/users/${userId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${WP_AUTH}`,
        },
        body: JSON.stringify({
            meta: {
                [key]: value
            }
        }),
    });

    if (!res.ok) {
        const error = await res.json();
        console.warn("Meta update warning:", error);
        throw new Error("Failed to update user meta");
    }

    return res.json();
}

// 사용자 정보 수정 (Description 등 일반 필드)
export async function updateUser(userId: number, data: Partial<WPUser> & { description?: string }) {
    const res = await fetch(`${WP_API_URL}/users/${userId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${WP_AUTH}`,
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update user");
    }

    return res.json();
}
