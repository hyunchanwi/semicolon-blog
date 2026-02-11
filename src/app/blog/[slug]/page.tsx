import { getPostBySlug, getPosts, getFeaturedImageUrl, stripHtml, decodeHtmlEntities } from "@/lib/wp-api";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookmarkButton } from "@/components/post/BookmarkButton";
import { AISummaryWrapper } from "@/components/post/AISummaryWrapper";
import { CoupangProducts } from "@/components/post/CoupangProducts";
import { GoogleAdUnit } from "@/components/ads/GoogleAdUnit";
import { SubscribeForm } from "@/components/subscribe/SubscribeForm";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { splitContentForAds } from "@/lib/ads";
import { processContentForTOC } from "@/lib/toc";
import type { Metadata } from "next";

interface Props {
    params: Promise<{ slug: string }>;
}

// Generate static params for SSG
export async function generateStaticParams() {
    const posts = await getPosts(50);
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

// Dynamic metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        return { title: "Post Not Found" };
    }

    const title = stripHtml(post.title.rendered);
    const description = stripHtml(post.excerpt.rendered).slice(0, 160);
    const imageUrl = getFeaturedImageUrl(post);

    return {
        title,
        description,
        alternates: {
            canonical: `/blog/${slug}`,
        },
        openGraph: {
            type: "article",
            title,
            description,
            url: `https://semicolonittech.com/blog/${slug}`,
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

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    const imageUrl = getFeaturedImageUrl(post);
    const date = new Date(post.date).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    // TOC 처리: 헤딩에 ID 주입 + 목차 데이터 추출
    const { content: processedContent, toc } = processContentForTOC(post.content.rendered);
    const hasToc = toc.length >= 2;

    return (
        <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Back Button */}
            <div className="flex items-center justify-between mb-8">
                <Button
                    asChild
                    variant="ghost"
                    className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <Link href="/blog">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        블로그로 돌아가기
                    </Link>
                </Button>

                <BookmarkButton postId={post.id} />
            </div>

            {/* Hero Header */}
            <header className="relative w-full mb-12 rounded-3xl overflow-hidden shadow-2xl bg-slate-900">
                {/* Background Image */}
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
                    {/* Category Badge */}
                    <div className="mb-6 flex justify-center flex-wrap gap-2">
                        {post._embedded?.["wp:term"]?.[0]?.map((term) => (
                            <Link
                                key={term.id}
                                href={`/blog/category/${term.slug}`}
                                className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full text-sm font-semibold hover:bg-white/20 transition"
                            >
                                {term.name}
                            </Link>
                        ))}
                    </div>

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

            {/* AI Summary */}
            <div className="mb-8">
                {/* [AdSense] Top Ad Unit */}
                <GoogleAdUnit slotId="8044380932" className="mb-8" />
            </div>

            <AISummaryWrapper
                postId={post.id}
                content={post.content.rendered}
                savedSummary={post.meta?.ai_summary}
            />

            {/* Mobile TOC */}
            {hasToc && (
                <div className="max-w-4xl mx-auto">
                    <TableOfContents items={toc} />
                </div>
            )}

            {/* Content + Desktop TOC Sidebar */}
            <div className={`flex gap-8 ${hasToc ? '' : 'max-w-4xl mx-auto'}`}>
                {/* Main Content */}
                <div
                    className="prose prose-xl prose-slate dark:prose-invert max-w-none flex-1 min-w-0
          prose-headings:font-bold prose-headings:text-slate-900 prose-headings:tracking-tight
          prose-p:text-slate-800 prose-p:leading-8 prose-p:text-[1.125rem] md:prose-p:text-[1.2rem]
          prose-li:text-slate-800 prose-li:text-[1.125rem] md:prose-li:text-[1.2rem]
          prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
          prose-img:rounded-3xl prose-img:shadow-lg prose-img:my-10
          prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-indigo-600 prose-code:font-semibold
          prose-pre:bg-slate-900 prose-pre:rounded-2xl
          [&>h2]:text-3xl [&>h2]:mt-12 [&>h2]:mb-6
          [&>h3]:text-2xl [&>h3]:mt-10 [&>h3]:mb-4"
                >
                    {(() => {
                        const { firstHalf, secondHalf } = splitContentForAds(processedContent);
                        return (
                            <>
                                <div dangerouslySetInnerHTML={{ __html: firstHalf }} />
                                {secondHalf && (
                                    <>
                                        <div className="my-12">
                                            <GoogleAdUnit
                                                slotId="5212379301"
                                                layout="in-article"
                                                format="fluid"
                                                className="w-full"
                                            />
                                        </div>
                                        <div dangerouslySetInnerHTML={{ __html: secondHalf }} />
                                    </>
                                )}
                            </>
                        );
                    })()}
                </div>

                {/* Desktop TOC Sidebar */}
                {hasToc && <TableOfContents items={toc} />}
            </div>

            {/* Bottom Ad Unit */}
            <div className="my-12">
                <GoogleAdUnit slotId="5688836445" className="w-full" />
            </div>

            {/* Coupang Products Recommendation */}
            <CoupangProducts />

            {/* Subscribe Banner */}
            <div className="my-12">
                <SubscribeForm />
            </div>

            {/* Footer */}
            <footer className="mt-16 pt-8 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-slate-600">
                        이 글이 도움이 되셨나요?
                    </p>
                    <Button asChild className="rounded-full">
                        <Link href="/blog">
                            더 많은 글 보기
                        </Link>
                    </Button>
                </div>
            </footer>
        </article>
    );
}
