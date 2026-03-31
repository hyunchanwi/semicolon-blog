import { getPostBySlug, getPosts, getFeaturedImageUrl, stripHtml, decodeHtmlEntities, sanitizePostContent } from "@/lib/wp-api";
import { getTranslationPair } from "@/lib/wp-api";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookmarkButton } from "@/components/post/BookmarkButton";
import { AISummaryWrapper } from "@/components/post/AISummaryWrapper";
import { GoogleAdUnit } from "@/components/ads/GoogleAdUnit";
import { SubscribeForm } from "@/components/subscribe/SubscribeForm";
import { ShareButtons } from "@/components/post/ShareButtons";
import { PostContentLayout } from "@/components/blog/PostContentLayout";
import { processContentForTOC } from "@/lib/toc";
import type { Metadata } from "next";

interface Props {
    params: Promise<{ slug: string }>;
}

// Dynamic metadata for English posts
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        return { title: "Post Not Found" };
    }

    const title = stripHtml(post.title.rendered);
    const description = stripHtml(post.excerpt.rendered).slice(0, 160);
    const imageUrl = getFeaturedImageUrl(post);

    // Find the Korean translation pair for hreflang
    const koPairId = post.meta?.translation_pair;
    let koSlug: string | null = null;
    if (koPairId) {
        const koPair = await getTranslationPair(koPairId);
        if (koPair) koSlug = koPair.slug;
    }

    return {
        title,
        description,
        alternates: {
            canonical: `/en/blog/${slug}`,
            languages: koSlug ? {
                ko: `/blog/${koSlug}`,
                en: `/en/blog/${slug}`,
            } : undefined,
        },
        openGraph: {
            type: "article",
            locale: "en_US",
            title,
            description,
            url: `https://semicolonittech.com/en/blog/${slug}`,
            publishedTime: post.date,
            images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630 }] : [],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: imageUrl ? [imageUrl] : [],
        },
    };
}

export default async function EnglishBlogPostPage({ params }: Props) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    const imageUrl = getFeaturedImageUrl(post);
    const date = new Date(post.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    // Find Korean pair for language switcher
    const koPairId = post.meta?.translation_pair;
    let koSlug: string | null = null;
    if (koPairId) {
        const koPair = await getTranslationPair(koPairId);
        if (koPair) koSlug = koPair.slug;
    }

    const fixedContent = sanitizePostContent(post.content.rendered);
    const { content: processedContent, toc } = processContentForTOC(fixedContent);
    const hasToc = toc.length >= 2;

    return (
        <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Back Button + Language Switch */}
            <div className="flex items-center justify-between mb-8">
                <Button
                    asChild
                    variant="ghost"
                    className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <Link href="/en/blog">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Blog
                    </Link>
                </Button>

                <div className="flex items-center gap-2">
                    {koSlug && (
                        <Button asChild variant="outline" size="sm" className="rounded-full">
                            <Link href={`/blog/${koSlug}`}>
                                🇰🇷 한국어로 읽기
                            </Link>
                        </Button>
                    )}
                    <BookmarkButton postId={post.id} />
                </div>
            </div>

            {/* Hero Header */}
            <header className="relative w-full mb-12 rounded-3xl overflow-hidden shadow-2xl bg-slate-900">
                {imageUrl && (
                    <div className="absolute inset-0 w-full h-full">
                        <img
                            src={imageUrl}
                            alt={stripHtml(post.title.rendered)}
                            className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    </div>
                )}

                <div className="relative z-10 px-8 py-16 md:py-24 text-center">
                    <h1
                        className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-8 break-keep drop-shadow-xl"
                        dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                    />

                    <div className="flex flex-wrap items-center justify-center gap-6 text-slate-200 font-medium">
                        <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                            <Calendar className="h-5 w-5 text-indigo-400" />
                            <span>{date}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                            <User className="h-5 w-5 text-indigo-400" />
                            <span>Semicolon; Team</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Ad Unit */}
            <div className="mb-8">
                <GoogleAdUnit slotId="8044380932" className="mb-8" />
            </div>

            <AISummaryWrapper
                postId={post.id}
                content={post.content.rendered}
                savedSummary={post.meta?.ai_summary}
            />

            <PostContentLayout
                content={processedContent}
                toc={toc}
                hasToc={hasToc}
            />

            {/* Social Share */}
            <div className="max-w-4xl mx-auto">
                <ShareButtons
                    title={stripHtml(post.title.rendered)}
                    url={`/en/blog/${post.slug}`}
                />
            </div>

            {/* Bottom Ad */}
            <div className="my-12">
                <GoogleAdUnit slotId="5688836445" className="w-full" />
            </div>

            {/* Subscribe */}
            <div className="my-12">
                <SubscribeForm />
            </div>

            {/* Footer */}
            <footer className="mt-16 pt-8 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-slate-600">
                        Did you find this article helpful?
                    </p>
                    <Button asChild className="rounded-full">
                        <Link href="/en/blog">
                            Read More Posts
                        </Link>
                    </Button>
                </div>
            </footer>
        </article>
    );
}
