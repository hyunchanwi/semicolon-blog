import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FolderOpen, Eye, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getPosts, getCategories, stripHtml, decodeHtmlEntities } from "@/lib/wp-api";

export const dynamic = 'force-dynamic'; // Always fetch fresh data (never use build-time cache)

export default async function AdminDashboard() {
    const [posts, categories] = await Promise.all([
        getPosts(100),
        getCategories(),
    ]);

    const stats = [
        { title: "전체 글", value: posts.length, icon: FileText, color: "text-blue-500" },
        { title: "카테고리", value: categories.length, icon: FolderOpen, color: "text-violet-500" },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">대시보드</h1>
                    <p className="text-slate-600 mt-1">Semicolon; 블로그 관리</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline" className="rounded-xl">
                        <Link href="https://wp.semicolonittech.com/wp-admin" target="_blank">
                            <img src="https://s.w.org/style/images/about/WordPress-logotype-wmark.png" className="w-4 h-4 mr-2 opacity-50" alt="WP" />
                            WordPress 관리자
                        </Link>
                    </Button>
                    <Button asChild className="rounded-xl">
                        <Link href="/admin/posts/new">
                            <Plus className="h-4 w-4 mr-2" />
                            새 글 작성
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <Link key={i} href={i === 0 ? "/admin/posts" : i === 1 ? "/admin/categories" : "#"} className="block transition-transform hover:scale-[1.02]">
                            <Card className="rounded-2xl border-0 shadow-md h-full cursor-pointer hover:shadow-lg transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-600">
                                        {stat.title}
                                    </CardTitle>
                                    <Icon className={`h-5 w-5 ${stat.color}`} />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            {/* Recent Posts */}
            <Card className="rounded-2xl border-0 shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg">최근 글</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {posts.slice(0, 5).map((post) => (
                            <div
                                key={post.id}
                                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                            >
                                <div>
                                    <p className="font-medium text-slate-900">
                                        {decodeHtmlEntities(stripHtml(post.title.rendered))}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {new Date(post.date).toLocaleDateString("ko-KR")}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button asChild variant="ghost" size="sm" className="rounded-lg">
                                        <Link href={`/blog/${post.slug}`} target="_blank">
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="sm" className="rounded-lg">
                                        <Link href={`/admin/posts/${post.id}/edit`}>
                                            수정
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
