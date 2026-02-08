"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BookmarkButtonProps {
    postId: number;
}

export function BookmarkButton({ postId }: BookmarkButtonProps) {
    const { data: session } = useSession();
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (session?.user) {
            checkBookmarkStatus();
        } else {
            setIsLoading(false);
        }
    }, [session]);

    const checkBookmarkStatus = async () => {
        try {
            const res = await fetch("/api/user/bookmarks");
            if (res.ok) {
                const data = await res.json();
                const exists = data.bookmarks.some((b: any) => b.id === postId);
                setIsBookmarked(exists);
            }
        } catch (e) {
            console.error("Failed to check bookmark", e);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleBookmark = async () => {
        if (!session) {
            if (confirm("로그인이 필요한 기능입니다. 로그인 하시겠습니까?")) {
                signIn();
            }
            return;
        }

        const action = isBookmarked ? "remove" : "add";
        // Optimistic update
        setIsBookmarked(!isBookmarked);

        try {
            const res = await fetch("/api/user/bookmarks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ postId, action }),
            });

            if (!res.ok) {
                // Revert on failure
                setIsBookmarked(isBookmarked);
                alert("북마크 처리에 실패했습니다.");
            }
        } catch (e) {
            setIsBookmarked(isBookmarked);
            console.error(e);
        }
    };

    if (isLoading) return <div className="animate-pulse w-8 h-8 rounded-full bg-slate-100" />;

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleBookmark}
            className={`rounded-full transition-all duration-300 ${isBookmarked ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
            title={isBookmarked ? "북마크 취소" : "북마크 저장"}
        >
            <Bookmark className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`} />
        </Button>
    );
}
