/**
 * fix-missing-thumbnails.ts
 * 썸네일이 없는 글에서 이미지를 추출해서 자동으로 업로드 & 설정
 *
 * 실행: npx ts-node --esm scripts/fix-missing-thumbnails.ts
 * 또는: npx tsx scripts/fix-missing-thumbnails.ts
 */

import { Agent, fetch as undiciFetch } from "undici";

const http1Agent = new Agent({ allowH2: false });
const wpFetch = (url: string, opts: any = {}) =>
    undiciFetch(url, { ...opts, dispatcher: http1Agent }) as any;
// 일반 외부 이미지 다운로드는 기본 fetch 사용 (undici로 하면 일부 외부 서버에서 차단)
const extFetch = (url: string, opts: any = {}) =>
    fetch(url, opts);

const WP_API_URL = "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

/** 구 도메인 → 새 도메인 변환 */
function fixImageUrl(url: string): string {
    return url.replace(
        "https://semicolonittech.com/wp-content/",
        "https://wp.semicolonittech.com/wp-content/"
    );
}

// ─── 유틸 ───────────────────────────────────────────────────────
function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

/** HTML 본문에서 첫 번째 이미지 URL 추출 */
function extractImageFromContent(html: string): string | null {
    // 1. YouTube thumbnail (iframe embed에서 video ID 추출)
    const youtubeMatch = html.match(
        /(?:youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/
    );
    if (youtubeMatch) {
        return `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
    }

    // 2. wp-content 이미지
    const wpImgMatch = html.match(/src=["'](https?:\/\/[^"']*\/wp-content\/uploads\/[^"']+)["']/);
    if (wpImgMatch) return wpImgMatch[1];

    // 3. 일반 img 태그
    const imgMatch = html.match(/src=["'](https?:\/\/[^"'\s>]+\.(?:jpg|jpeg|png|webp|gif))["']/i);
    if (imgMatch) return imgMatch[1];

    return null;
}

/** 이미지 URL → WordPress 미디어 업로드 → media ID 반환 */
async function uploadImageToWP(imageUrl: string, title: string): Promise<number | null> {
    try {
        // 구 도메인 URL 교체
        const fixedUrl = fixImageUrl(imageUrl);
        console.log(`  📥 Downloading: ${fixedUrl.slice(0, 80)}...`);

        let imgRes: any;
        // wp.semicolonittech.com은 undici HTTP/1.1, 외부 URL은 일반 fetch
        if (fixedUrl.includes("wp.semicolonittech.com")) {
            imgRes = await wpFetch(fixedUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
        } else {
            imgRes = await extFetch(fixedUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
        }

        if (!imgRes.ok) {
            console.log(`  ❌ Download failed: ${imgRes.status}`);
            return null;
        }

        const arrayBuffer = await imgRes.arrayBuffer();
        const contentType: string = imgRes.headers.get("content-type") || "image/jpeg";
        const ext = contentType.includes("webp") ? "webp"
            : contentType.includes("png") ? "png" : "jpg";
        const filename = `${title.replace(/[^a-z0-9]/gi, "-").toLowerCase().slice(0, 50)}-${Date.now()}.${ext}`;

        console.log(`  📤 Uploading as: ${filename}`);

        // WordPress REST API: FormData 대신 바이너리 직접 업로드 (undici와 호환성 ↑)
        const uploadRes = await wpFetch(`${WP_API_URL}/media`, {
            method: "POST",
            headers: {
                Authorization: `Basic ${WP_AUTH}`,
                "Content-Type": contentType,
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
            body: arrayBuffer,
        });

        if (!uploadRes.ok) {
            const err = await uploadRes.text();
            console.log(`  ❌ Upload failed: ${uploadRes.status} ${err.slice(0, 100)}`);
            return null;
        }

        const data = await uploadRes.json();
        console.log(`  ✅ Uploaded: ID=${data.id} url=${data.source_url?.slice(0, 60)}`);
        return data.id;
    } catch (e: any) {
        console.error(`  ❌ Error: ${e.message}`);
        return null;
    }
}

/** 글에 featured_media 설정 */
async function setFeaturedMedia(postId: number, mediaId: number): Promise<boolean> {
    const res = await wpFetch(`${WP_API_URL}/posts/${postId}`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${WP_AUTH}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ featured_media: mediaId }),
    });
    return res.ok;
}

// ─── 메인 ───────────────────────────────────────────────────────
async function main() {
    console.log("🔍 썸네일 없는 글 조회 중...\n");

    // 모든 글 (최근 200개)을 가져와서 featured_media=0인 것 필터링
    let page = 1;
    const postsToFix: any[] = [];

    while (true) {
        const res = await wpFetch(
            `${WP_API_URL}/posts?per_page=100&page=${page}&status=publish,draft,private&_fields=id,title,content,featured_media`,
            { headers: { Authorization: `Basic ${WP_AUTH}` } }
        );

        if (!res.ok) break;

        const posts = await res.json();
        if (!posts.length) break;

        for (const post of posts) {
            if (!post.featured_media || post.featured_media === 0) {
                postsToFix.push(post);
            }
        }

        if (posts.length < 100) break;
        page++;
    }

    console.log(`📋 썸네일 없는 글: ${postsToFix.length}개\n`);

    if (postsToFix.length === 0) {
        console.log("✅ 모든 글에 썸네일이 있습니다!");
        return;
    }

    let fixed = 0;
    let failed = 0;

    for (const post of postsToFix) {
        const title = post.title?.rendered?.replace(/<[^>]+>/g, "") || `post-${post.id}`;
        console.log(`\n🔧 [ID:${post.id}] ${title.slice(0, 60)}`);

        const imageUrl = extractImageFromContent(post.content?.rendered || "");

        if (!imageUrl) {
            console.log(`  ⚠️ 이미지 URL 추출 실패 (콘텐츠에 이미지 없음)`);
            failed++;
            continue;
        }

        const mediaId = await uploadImageToWP(imageUrl, title);

        if (!mediaId) {
            failed++;
            continue;
        }

        const ok = await setFeaturedMedia(post.id, mediaId);
        if (ok) {
            console.log(`  ✅ 썸네일 설정 완료!`);
            fixed++;
        } else {
            console.log(`  ❌ 썸네일 설정 실패`);
            failed++;
        }

        await sleep(500); // Rate limiting
    }

    console.log(`\n═══════════════════════════════`);
    console.log(`✅ 복구 완료: ${fixed}개`);
    console.log(`❌ 실패: ${failed}개`);
}

main().catch(console.error);
