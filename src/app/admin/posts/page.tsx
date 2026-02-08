import Link from "next/link";
import { getPosts, getCategories, getPostsByCategory, stripHtml, decodeHtmlEntities, getTags } from "@/lib/wp-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Eye, Trash2 } from "lucide-react";
import { DeletePostButton } from "@/components/admin/DeletePostButton";
import { CategoryFilter } from "@/components/admin/CategoryFilter";
import { QuickCategorySelect } from "@/components/admin/QuickCategorySelect";

interface Props {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const dynamic = "force-dynamic";

export default async function AdminPostsPage({ searchParams }: Props) {
    const params = await searchParams;
    const categoryId = params.category ? parseInt(params.category as string) : null;

    // Fetch posts based on filter
    const posts = categoryId
        ? await getPostsByCategory(categoryId, 50)
        : await getPosts(50);

    const categories = await getCategories();
    const tags = await getTags();
    const youtubeTagId = tags.find(t => t.name.toLowerCase() === 'youtube')?.id || -1;
    const trendTagId = tags.find(t => t.name.toLowerCase() === 'trend')?.id || -1;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">글 관리</h1>
                    <p className="text-slate-600">총 {posts.length}개의 글</p>
                </div>
                <div className="flex gap-2">
                    <CategoryFilter categories={categories} />
                    <Button asChild className="rounded-xl">
                        <Link href="/admin/posts/new">
                            <Plus className="h-4 w-4 mr-2" />
                            새 글 작성
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Posts Table */}
            <Card className="rounded-2xl border-0 shadow-md">
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="text-left p-4 font-medium text-slate-600">제목</th>
                                <th className="text-left p-4 font-medium text-slate-600 hidden sm:table-cell w-28">카테고리</th>
                                <th className="text-left p-4 font-medium text-slate-600 hidden md:table-cell">날짜</th>
                                <th className="text-right p-4 font-medium text-slate-600">작업</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {posts.map((post) => (
                                <tr key={post.id} className="hover:bg-slate-50/50">
                                    <td className="p-4">
                                        <p className="font-medium text-slate-900">
                                            {decodeHtmlEntities(stripHtml(post.title.rendered))}
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-1 mb-1">
                                            {post.tags?.includes(youtubeTagId) && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                    YouTube
                                                </span>
                                            )}
                                            {post.tags?.includes(trendTagId) && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                    Trend
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 line-clamp-1 mt-1">
                                            {stripHtml(post.excerpt.rendered).slice(0, 80)}...
                                        </p>
                                    </td>
                                    <td className="p-4 hidden sm:table-cell">
                                        <QuickCategorySelect
                                            postId={post.id}
                                            currentCategoryId={post.categories?.[0] || null}
                                            categories={categories}
                                        />
                                    </td>
                                    <td className="p-4 text-slate-600 hidden md:table-cell">
                                        {new Date(post.date).toLocaleDateString("ko-KR")}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-end gap-2">
                                            <Button asChild variant="ghost" size="sm" className="rounded-lg">
                                                <Link href={`/blog/${post.slug}`} target="_blank">
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button asChild variant="outline" size="sm" className="rounded-lg">
                                                <Link href={`/admin/posts/${post.id}/edit`}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <DeletePostButton id={post.id} title={decodeHtmlEntities(stripHtml(post.title.rendered))} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
