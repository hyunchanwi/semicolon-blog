import Link from "next/link";
import Image from "next/image";
import { getPosts, getFeaturedImageUrl, stripHtml, decodeHtmlEntities, WPPost } from "@/lib/wp-api";

interface RelatedPostsProps {
    currentPostId: number;
    categoryId: number;
}

export async function RelatedPosts({ currentPostId, categoryId }: RelatedPostsProps) {
    // 같은 카테고리의 글 가져오기
    let allPosts: WPPost[] = [];

    try {
        // 카테고리별로 필터링이 필요하면 별도 fetch
        if (categoryId > 0) {
            const res = await fetch(
                `https://wp.semicolonittech.com/wp-json/wp/v2/posts?per_page=10&categories=${categoryId}&_embed`,
                { next: { revalidate: 3600 } }
            );
            if (res.ok) {
                allPosts = await res.json();
            }
        } else {
            allPosts = await getPosts(10);
        }
    } catch (error) {
        console.error('Error fetching related posts:', error);
        return null;
    }

    // 현재 글 제외하고 최대 3개
    const relatedPosts = allPosts
        .filter((post: WPPost) => post.id !== currentPostId)
        .slice(0, 3);

    if (relatedPosts.length === 0) {
        return null;
    }

    return (
        <section className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
                📰 관련 글
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((post: WPPost) => {
                    const thumbnail = getFeaturedImageUrl(post);

                    return (
                        <Link
                            key={post.id}
                            href={`/blog/${post.slug}`}
                            className="group block rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        >
                            {/* Thumbnail */}
                            <div className="relative h-40 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600">
                                {thumbnail ? (
                                    <Image
                                        src={thumbnail}
                                        alt={decodeHtmlEntities(stripHtml(post.title.rendered))}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl">
                                        📄
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-primary transition-colors">
                                    {decodeHtmlEntities(stripHtml(post.title.rendered))}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                    {new Date(post.date).toLocaleDateString('ko-KR')}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section >
    );
}
