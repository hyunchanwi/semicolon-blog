import { getPostsWithPaginationByLang } from "@/lib/wp-api";
import { PostCard } from "@/components/post/PostCard";
import { Pagination } from "@/components/ui/Pagination";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Blog",
    description: "Read all posts from Semicolon; tech blog in English.",
    alternates: {
        canonical: "/en/blog",
        languages: {
            ko: "/blog",
            en: "/en/blog",
        },
    },
};

interface Props {
    searchParams: Promise<{ page?: string }>;
}

export default async function EnglishBlogPage(props: Props) {
    const searchParams = await props.searchParams;
    const page = Number(searchParams?.page) || 1;
    const { posts, totalPages } = await getPostsWithPaginationByLang("en", page, 12);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                    Blog
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-400">
                    Discover the latest trends and insights in technology
                </p>
            </div>

            {posts.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-slate-500 text-lg">
                        English posts are coming soon! 🚀
                    </p>
                    <p className="text-slate-400 mt-2">
                        New posts will be automatically published in English.
                    </p>
                </div>
            ) : (
                <>
                    {/* Posts Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <PostCard key={post.id} post={post} basePath="/en/blog" />
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="mt-12">
                        <Pagination currentPage={page} totalPages={totalPages} basePath="/en/blog" />
                    </div>
                </>
            )}
        </div>
    );
}
