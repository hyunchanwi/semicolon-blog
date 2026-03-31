import { NextRequest, NextResponse } from "next/server";
import { generateContentWithRetry } from "@/lib/gemini";
import { createBilingualPosts, getOrCreateTag } from "@/lib/wp-server";
import { ensureHtml } from "@/lib/markdown-to-html";
import { Agent, fetch as undiciFetch } from "undici";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const _http1Agent = new Agent({ allowH2: false });
const wpFetch = (url: string, opts: any = {}) => undiciFetch(url, { ...opts, dispatcher: _http1Agent }) as any;

const CRON_SECRET = process.env.CRON_SECRET;
const WP_API_URL = process.env.WP_API_URL || "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

/**
 * Finds recent Korean posts that don't have an English translation yet.
 * Checks if a post has a 'translation_pair' meta field set.
 */
async function findUntranslatedPosts(limit: number = 5): Promise<any[]> {
    try {
        // Fetch recent published posts
        const res = await wpFetch(
            `${WP_API_URL}/posts?per_page=${limit}&status=publish&orderby=date&order=desc&_fields=id,title,content,slug,categories,tags,featured_media,meta`,
            {
                headers: { 'Authorization': `Basic ${WP_AUTH}` },
                cache: 'no-store'
            }
        );

        if (!res.ok) return [];
        const posts = await res.json();

        // Filter: only Korean posts without a translation_pair
        // English posts have the 'en' tag, so we need to find the 'en' tag ID to exclude them
        let enTagId: number | null = null;
        try {
            const tagRes = await wpFetch(`${WP_API_URL}/tags?slug=en`);
            if (tagRes.ok) {
                const tags = await tagRes.json();
                if (tags.length > 0) enTagId = tags[0].id;
            }
        } catch {}

        return posts.filter((p: any) => {
            // Skip if already has a translation pair
            if (p.meta?.translation_pair) return false;
            // Skip if it's an English post (has 'en' tag)
            if (enTagId && p.tags?.includes(enTagId)) return false;
            return true;
        });
    } catch (e) {
        console.error("[Translate] Error finding untranslated posts:", e);
        return [];
    }
}

/**
 * Generates English content from Korean HTML using Gemini.
 */
async function translateToEnglish(koreanTitle: string, koreanContent: string): Promise<{ title: string; content: string } | null> {
    const prompt = `
You are a professional English tech blogger for "Semicolon;" (a Korean tech blog).
Your task is to rewrite the following Korean blog post as a natural, high-quality English blog post.

IMPORTANT RULES:
1. This is NOT a literal translation. Write as a native English tech blogger would.
2. Keep the same structure, facts, and order of information.
3. Use professional yet accessible English (like The Verge or TechCrunch style).
4. Output format: Pure HTML only (<h2>, <h3>, <p>, <ul>, <li>, <strong>, <table>, <a>, <blockquote>).
5. The first line must be an <h2> tag with the English title.
6. Do NOT use Markdown formatting. HTML only.
7. Keep all existing <a> links and <img> tags as-is (don't translate URLs).
8. Keep [IMAGE: ...] placeholders exactly as they are.
9. Length should be similar to the Korean version.

Korean Title: ${koreanTitle}

Korean Content (HTML):
${koreanContent.slice(0, 12000)}
`;

    try {
        const result = await generateContentWithRetry(prompt, "gemini-2.5-flash", 3, false);
        const response = await result.response;
        let text = response.text().trim();

        // Clean up
        text = text.replace(/```html/g, "").replace(/```/g, "").trim();
        text = ensureHtml(text);

        // Extract title from <h2>
        const titleMatch = text.match(/<h2[^>]*>([^<]+)<\/h2>/);
        const enTitle = titleMatch ? titleMatch[1].trim() : koreanTitle;

        return {
            title: enTitle,
            content: text,
        };
    } catch (e) {
        console.error("[Translate] Gemini translation failed:", e);
        return null;
    }
}

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        console.log("[Translate] Warning: No auth header");
    }

    try {
        console.log("[Translate] 🌐 Starting translation cron...");

        // 1. Find one untranslated Korean post
        const untranslated = await findUntranslatedPosts(10);

        if (untranslated.length === 0) {
            console.log("[Translate] ✅ All recent posts are already translated!");
            return NextResponse.json({ success: true, message: "No posts to translate" });
        }

        // Pick the most recent untranslated post
        const post = untranslated[0];
        const koTitle = post.title?.rendered?.replace(/<[^>]+>/g, '').trim() || "Untitled";
        const koContent = post.content?.rendered || "";

        console.log(`[Translate] 📝 Translating: "${koTitle}" (ID: ${post.id})`);

        // 2. Generate English version
        const enResult = await translateToEnglish(koTitle, koContent);

        if (!enResult) {
            return NextResponse.json({ success: false, error: "Translation failed" });
        }

        console.log(`[Translate] ✅ English version generated: "${enResult.title.slice(0, 50)}..."`);

        // 3. Publish English post and link to Korean
        const enTagId = await getOrCreateTag('en', WP_AUTH);
        const enTags = [...(post.tags || [])];
        if (enTagId) enTags.push(enTagId);

        const enSlug = post.slug ? `${post.slug}-en` : undefined;
        const translationGroup = `grp_${post.id}`;

        // Create English post
        const { createPostWithIndexing } = await import("@/lib/wp-server");

        const enPost = await createPostWithIndexing({
            title: enResult.title,
            content: enResult.content + `\n<!-- translation_of: ${post.id} -->`,
            slug: enSlug,
            categories: post.categories,
            tags: enTags,
            featured_media: post.featured_media || undefined,
            status: 'publish',
            meta: {
                translation_group: translationGroup,
                lang: 'en',
                translation_pair: post.id,
            }
        }, WP_AUTH);

        if (!enPost) {
            return NextResponse.json({ success: false, error: "Failed to publish English post" });
        }

        // 4. Update Korean post with translation_pair
        await wpFetch(`${WP_API_URL}/posts/${post.id}`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${WP_AUTH}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                meta: {
                    translation_group: translationGroup,
                    lang: 'ko',
                    translation_pair: enPost.id,
                }
            })
        });

        console.log(`[Translate] ✅ Linked: KO #${post.id} ↔ EN #${enPost.id}`);

        // 5. Google Indexing for English URL
        const { googlePublishUrl } = await import("@/lib/google-indexing");
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semicolonittech.com";
        const enPostAny = enPost as any;
        const enPostSlug = enPostAny.slug || enSlug || '';
        await googlePublishUrl(`${siteUrl}/en/blog/${enPostSlug}`);

        return NextResponse.json({
            success: true,
            koPostId: post.id,
            enPostId: enPost.id,
            koTitle,
            enTitle: enResult.title,
        });

    } catch (e) {
        console.error("[Translate] Error:", e);
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
