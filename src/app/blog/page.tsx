import Link from "next/link";
import { getPostsWithPagination } from "@/lib/wp-api";
import { PostCard } from "@/components/post/PostCard";
import { Pagination } from "@/components/ui/Pagination";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "블로그",
    description: "Semicolon; 블로그의 모든 글을 확인하세요.",
};

interface Props {
    searchParams: Promise<{ page?: string }>;
}

// Next.js 15+ searchParams is a Promise
export default async function BlogPage(props: Props) {
    const searchParams = await props.searchParams;
    const page = Number(searchParams?.page) || 1;
    const { posts, totalPages } = await getPostsWithPagination(page, 12);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                    블로그
                </h1>
                <p className="text-xl text-slate-600">
                    기술의 최신 트렌드와 인사이트를 만나보세요
                </p>
            </div>

            {/* Posts Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>

            {/* Pagination */}
            <div className="mt-12">
                <Pagination currentPage={page} totalPages={totalPages} basePath="/blog" />
            </div>
        </div>
    );
}
