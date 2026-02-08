import Link from "next/link";
import { getCategoryBySlug, getPostsByCategory, getCategories, getFeaturedImageUrl, stripHtml, decodeHtmlEntities } from "@/lib/wp-api";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

interface Props {
    params: Promise<{ slug: string }>;
}

// Generate static params
export async function generateStaticParams() {
    const categories = await getCategories();
    return categories.map((cat) => ({
        slug: cat.slug,
    }));
}

// Dynamic metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const category = await getCategoryBySlug(slug);

    if (!category) {
        return { title: "Category Not Found" };
    }

    return {
        title: category.name,
        description: category.description || `${category.name} 카테고리의 모든 글`,
    };
}

export default async function CategoryPage({ params }: Props) {
    const { slug } = await params;
    const category = await getCategoryBySlug(slug);

    if (!category) {
        notFound();
    }

    const posts = await getPostsByCategory(category.id, 20);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            {/* Header */}
            <div className="mb-16 md:mb-24 text-center max-w-3xl mx-auto">
                <span className="inline-block px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-sm font-medium mb-6">
                    Category
                </span>
                <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
                    {category.name}
                </h1>
                {category.description && (
                    <p className="text-xl md:text-2xl text-slate-500 leading-relaxed font-light">
                        {category.description}
                    </p>
                )}
            </div>

            {/* Posts Grid */}
            {posts.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                    {posts.map((post) => {
                        // 1. Featured Image
                        let imageUrl = getFeaturedImageUrl(post);

                        // 2. Fallback: Content Image (First <img> tag)
                        if (!imageUrl && post.content?.rendered) {
                            const imgMatch = post.content.rendered.match(/<img[^>]+src=['"]([^'"]+)['"]/);
                            if (imgMatch) {
                                imageUrl = imgMatch[1];
                            }
                        }

                        const excerpt = stripHtml(post.excerpt.rendered).slice(0, 120) + "...";
                        const date = new Date(post.date).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        });

                        return (
                            <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                                <article className="flex flex-col h-full">
                                    {imageUrl && (
                                        <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden mb-6 shadow-sm group-hover:shadow-2xl transition-all duration-500">
                                            <img
                                                src={imageUrl}
                                                alt={decodeHtmlEntities(stripHtml(post.title.rendered))}
                                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 text-sm text-slate-500 mb-4">
                                            <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-600 font-medium">
                                                {category.name}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span>{date}</span>
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900 mb-4 leading-snug group-hover:text-primary transition-colors">
                                            {decodeHtmlEntities(stripHtml(post.title.rendered))}
                                        </h2>
                                        <p className="text-lg text-slate-500 leading-relaxed line-clamp-2">
                                            {excerpt}
                                        </p>
                                    </div>
                                </article>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-32 bg-slate-50 rounded-[3rem]">
                    <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-slate-100 mb-6">
                        <span className="text-2xl">📝</span>
                    </div>
                    <p className="text-xl text-slate-500 font-medium">
                        아직 작성된 글이 없습니다.
                    </p>
                    <p className="text-slate-400 mt-2">
                        새로운 소식을 기대해주세요!
                    </p>
                </div>
            )}
        </div>
    );
}
