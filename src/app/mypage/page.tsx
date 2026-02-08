"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, Bookmark, User, Loader2 } from "lucide-react";

interface BookmarkedPost {
    id: number;
    title: string;
    slug: string;
    date: string;
    thumbnail: string | null;
}

export default function MyPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            fetchBookmarks();
        }
    }, [status, router]);

    const fetchBookmarks = async () => {
        try {
            const res = await fetch("/api/user/bookmarks");
            if (res.ok) {
                const data = await res.json();
                setBookmarks(data.bookmarks);
            }
        } catch (e) {
            console.error("Failed to fetch bookmarks", e);
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!session?.user) return null;

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Profile Header */}
                <div className="bg-white rounded-[2rem] shadow-sm p-8 md:p-12 mb-8 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                    <div className="relative">
                        {session.user.image ? (
                            <img
                                src={session.user.image}
                                alt={session.user.name || "User"}
                                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-slate-100 shadow-md"
                            />
                        ) : (
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <User className="w-12 h-12" />
                            </div>
                        )}
                        <span className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></span>
                    </div>

                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">
                            {session.user.name} 님, 안녕하세요! 👋
                        </h1>
                        <p className="text-slate-500 text-lg mb-6">
                            {session.user.email}
                        </p>
                        <Button
                            variant="outline"
                            className="rounded-full gap-2 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                            onClick={() => signOut({ callbackUrl: "/" })}
                        >
                            <LogOut className="h-4 w-4" />
                            로그아웃
                        </Button>
                    </div>

                    <div className="text-center bg-slate-50 px-8 py-6 rounded-3xl">
                        <p className="text-sm text-slate-500 font-medium mb-1">저장한 글</p>
                        <p className="text-4xl font-bold text-indigo-600">{bookmarks.length}</p>
                    </div>
                </div>

                {/* Bookmarks Section */}
                <div>
                    <div className="flex items-center gap-2 mb-6 ml-2">
                        <Bookmark className="h-5 w-5 text-indigo-600" />
                        <h2 className="text-xl font-bold text-slate-900">내 서재 (Bookmarks)</h2>
                    </div>

                    {bookmarks.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {bookmarks.map((post) => (
                                <Link key={post.id} href={`/blog/${post.slug}`}>
                                    <Card className="group h-full overflow-hidden rounded-2xl border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
                                        {post.thumbnail && (
                                            <div className="relative h-48 overflow-hidden">
                                                <img
                                                    src={post.thumbnail}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                        )}
                                        <CardContent className="p-5">
                                            <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                                {post.title}
                                            </h3>
                                            <p className="text-sm text-slate-400">
                                                {new Date(post.date).toLocaleDateString()}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-white rounded-[2rem] border border-slate-100 border-dashed">
                            <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                                <Bookmark className="h-8 w-8 text-slate-300" />
                            </div>
                            <p className="text-lg text-slate-500 font-medium">아직 저장한 글이 없어요.</p>
                            <Button asChild variant="link" className="text-indigo-600 mt-2">
                                <Link href="/blog">글 보러 가기 &rarr;</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
