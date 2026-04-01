import 'dotenv/config';
import { Agent, fetch as undiciFetch } from 'undici';
import { generateContentWithRetry } from '../src/lib/gemini';
import { getOrCreateTag, createPostWithIndexing } from '../src/lib/wp-server';
import { ensureHtml } from '../src/lib/markdown-to-html';

const _http1Agent = new Agent({ allowH2: false });
const wpFetch = (url: string, opts: any = {}) => undiciFetch(url, { ...opts, dispatcher: _http1Agent }) as any;

const WP_API_URL = process.env.WP_API_URL || "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

async function translateToEnglish(koreanTitle: string, koreanContent: string): Promise<{ title: string; content: string } | null> {
    const prompt = `
You are a professional English tech blogger for "Semicolon;" (a Korean tech blog).
Your task is to rewrite the following Korean blog post as a natural, high-quality English blog post.

IMPORTANT RULES:
1. This is NOT a literal translation. Write as a native English tech blogger would.
2. Keep the same structure, facts, and order of information.
3. Use professional yet accessible English.
4. Output format: Pure HTML only (<h2>, <h3>, <p>, <ul>, <li>, <strong>, <a>, <blockquote>).
5. The first line must be an <h2> tag with the English title.
6. Do NOT use Markdown formatting. HTML only.
7. Keep all existing <a> links and <img> tags as-is (don't translate URLs).
8. Keep [IMAGE: ...] placeholders exactly as they are.

Korean Title: ${koreanTitle}

Korean Content (HTML):
${koreanContent.slice(0, 12000)}
`;
    try {
        const result = await generateContentWithRetry(prompt, "gemini-2.5-flash", 3, false);
        const response = await result.response;
        let text = response.text().trim();
        text = text.replace(/```html/g, "").replace(/```/g, "").trim();
        text = ensureHtml(text);
        const titleMatch = text.match(/<h2[^>]*>([^<]+)<\/h2>/);
        const enTitle = titleMatch ? titleMatch[1].trim() : koreanTitle;
        return { title: enTitle, content: text };
    } catch (e) {
        console.error("Translate failed:", e);
        return null;
    }
}

async function runTranslation(slug: string) {
    console.log(`Starting translation for slug: ${slug}`);
    
    // 1. Fetch Post
    const res = await wpFetch(`${WP_API_URL}/posts?slug=${encodeURIComponent(slug)}`, {
        headers: { 'Authorization': `Basic ${WP_AUTH}` }
    });
    const posts = await res.json();
    if (!posts || posts.length === 0) {
        console.error("Post not found!");
        return;
    }
    const post = posts[0];
    
    // 2. Translate
    const koTitle = post.title.rendered.replace(/<[^>]+>/g, '').trim();
    const koContent = post.content.rendered;
    console.log(`Translating: ${koTitle} (ID: ${post.id})`);
    
    const enResult = await translateToEnglish(koTitle, koContent);
    if (!enResult) return console.error("Translation returned null.");
    
    console.log(`Generated EN Title: ${enResult.title}`);
    
    // 3. Publish English
    const enTagId = await getOrCreateTag('en', WP_AUTH);
    const enTags = [...(post.tags || [])];
    if (enTagId && !enTags.includes(enTagId)) enTags.push(enTagId);

    const enSlug = post.slug ? `${post.slug}-en` : undefined;
    const translationGroup = `grp_${post.id}`;

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

    if (!enPost) return console.error("Failed to publish EN post.");
    
    // 4. Update KO post meta
    await wpFetch(`${WP_API_URL}/posts/${post.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${WP_AUTH}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta: { translation_group: translationGroup, lang: 'ko', translation_pair: enPost.id } })
    });
    
    console.log(`Successfully translated and linked! KO #${post.id} <-> EN #${enPost.id}`);
}

async function main() {
    const slugs = [
        encodeURIComponent("명조-3-1-버전-눈속에-있는-그대에게-사용자-후기-및-종"),
        "olleh-공유기-관리자-페이지에서-속도-확인-및-변경법",
    ];
    for (const slug of slugs) {
        await runTranslation(decodeURIComponent(slug));
    }
}

main().catch(console.error);
