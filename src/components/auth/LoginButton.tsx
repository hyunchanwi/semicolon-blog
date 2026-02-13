"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User, Settings, BookmarkCheck } from "lucide-react";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Admin email list (same as server-side)
const ADMIN_EMAILS = [
    process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    "hyunchan09@gmail.com",
    "wihyunchan@naver.com",
    "contactsemicolonblog@gmail.com"
].filter((email): email is string => !!email);

export const LoginButton = () => {
    const { data: session, status } = useSession();
    const isAdmin = session?.user?.email ? ADMIN_EMAILS.includes(session.user.email) : false;

    if (status === "loading") {
        return (
            <Button variant="ghost" size="sm" className="rounded-full" disabled>
                <User className="h-4 w-4 mr-2" />
                로딩...
            </Button>
        );
    }

    if (session) {
        return (
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="rounded-full pl-1.5 pr-3 py-1 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 gap-2 h-auto border border-transparent hover:border-slate-100 ring-0 focus:ring-0"
                    >
                        {session.user?.image ? (
                            <img
                                src={session.user.image}
                                alt={session.user.name || "User"}
                                className="w-8 h-8 rounded-full border border-slate-200 shadow-sm"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                <User className="h-4 w-4 text-slate-500" />
                            </div>
                        )}
                        <div className="flex flex-col items-start">
                            <span className="text-sm font-bold text-slate-700 leading-tight">
                                {session.user?.name?.split(" ")[0]}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium leading-tight">
                                반가워요!
                            </span>
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-2xl p-1 bg-white/90 backdrop-blur-xl border border-white/20 shadow-xl">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">My Account</p>
                    </div>

                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-indigo-50 focus:text-indigo-600 p-2.5 mb-1">
                        <Link href="/mypage">
                            <User className="mr-2 h-4 w-4" />
                            <span>마이페이지</span>
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-indigo-50 focus:text-indigo-600 p-2.5 mb-1">
                        <Link href="/mypage">
                            <BookmarkCheck className="mr-2 h-4 w-4" />
                            <span>내 서재 (북마크)</span>
                        </Link>
                    </DropdownMenuItem>

                    {isAdmin && (
                        <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-indigo-50 focus:text-indigo-600 p-2.5 mb-1">
                            <Link href="/admin">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>관리자 페이지</span>
                            </Link>
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                        onClick={() => signOut()}
                        className="rounded-xl cursor-pointer focus:bg-red-50 focus:text-red-600 p-2.5 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>로그아웃</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => signIn()}
        >
            <LogIn className="h-4 w-4 mr-2" />
            로그인
        </Button>
    );
};
