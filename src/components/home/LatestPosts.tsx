import Link from "next/link";
import { getPosts, getPostsWithPaginationByLang, getFeaturedImageUrl, stripHtml, decodeHtmlEntities, WPPost } from "@/lib/wp-api";
import { ArrowRight } from "lucide-react";

import { PostCard } from "@/components/post/PostCard";

export const LatestPosts = async ({ isEnglish = false }: { isEnglish?: boolean }) => {
    // 10초 ISR 캐시 적용 (메인 페이지 최신 글 빠른 반영)
    let posts: WPPost[] = [];
    if (isEnglish) {
        const result = await getPostsWithPaginationByLang('en', 1, 6);
        posts = result.posts;
    } else {
        posts = await getPosts(6, 10);
    }

    return (
        <section className="py-20 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                            {isEnglish ? "Latest Updates" : "최신 업데이트"}
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            {isEnglish ? "Check out our newest articles" : "새롭게 올라온 글들을 확인하세요"}
                        </p>
                    </div>
                    <Link
                        href={isEnglish ? "/en/blog" : "/blog"}
                        className="hidden md:flex items-center gap-2 text-primary dark:text-blue-400 font-medium hover:underline"
                    >
                        {isEnglish ? "View All" : "전체 보기"} <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                {/* Posts Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} basePath={isEnglish ? "/en/blog" : "/blog"} />
                    ))}
                </div>

                {/* Mobile: View All */}
                <div className="mt-8 text-center md:hidden">
                    <Link
                        href={isEnglish ? "/en/blog" : "/blog"}
                        className="inline-flex items-center gap-2 text-primary dark:text-blue-400 font-medium"
                    >
                        {isEnglish ? "View All" : "전체 보기"} <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
};
