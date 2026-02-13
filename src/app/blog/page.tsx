import Link from "next/link";
import { getPosts } from "@/lib/wp-api";
import { PostCard } from "@/components/post/PostCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "블로그",
    description: "Semicolon; 블로그의 모든 글을 확인하세요.",
};

export default async function BlogPage() {
    const posts = await getPosts(100, 60);

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
        </div>
    );
}
