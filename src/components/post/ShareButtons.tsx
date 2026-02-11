"use client";

import { useState } from "react";
import { Share2, Link2, Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareButtonsProps {
    title: string;
    url: string;
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
    const [copied, setCopied] = useState(false);
    const encodedTitle = encodeURIComponent(title);
    const encodedUrl = encodeURIComponent(url);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const shareToKakao = () => {
        // Kakao SDK should be loaded
        if (typeof window !== "undefined" && (window as any).Kakao?.Share) {
            (window as any).Kakao.Share.sendDefault({
                objectType: "feed",
                content: {
                    title: title,
                    description: "Semicolon; - 기술의 미래를 읽다",
                    imageUrl: "https://semicolon-next.vercel.app/og-image.png",
                    link: { mobileWebUrl: url, webUrl: url },
                },
                buttons: [
                    { title: "자세히 보기", link: { mobileWebUrl: url, webUrl: url } },
                ],
            });
        } else {
            // Fallback: open Kakao story
            window.open(`https://story.kakao.com/share?url=${encodedUrl}`, "_blank");
        }
    };

    const shareToTwitter = () => {
        window.open(
            `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
            "_blank",
            "width=600,height=400"
        );
    };

    const shareToNaverBlog = () => {
        window.open(
            `https://blog.naver.com/openapi/share?url=${encodedUrl}&title=${encodedTitle}`,
            "_blank",
            "width=600,height=400"
        );
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400 mr-2">
                공유하기
            </span>

            {/* Kakao */}
            <Button
                variant="outline"
                size="icon"
                onClick={shareToKakao}
                className="rounded-full w-9 h-9 bg-[#FEE500] hover:bg-[#FDD835] border-0 text-[#3C1E1E]"
                title="카카오톡 공유"
            >
                <MessageCircle className="h-4 w-4" />
            </Button>

            {/* Twitter/X */}
            <Button
                variant="outline"
                size="icon"
                onClick={shareToTwitter}
                className="rounded-full w-9 h-9 bg-black hover:bg-gray-800 border-0 text-white"
                title="X (Twitter) 공유"
            >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            </Button>

            {/* Naver Blog */}
            <Button
                variant="outline"
                size="icon"
                onClick={shareToNaverBlog}
                className="rounded-full w-9 h-9 bg-[#03C75A] hover:bg-[#02b350] border-0 text-white"
                title="네이버 블로그 공유"
            >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
                </svg>
            </Button>

            {/* Copy Link */}
            <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                className="rounded-full w-9 h-9 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="링크 복사"
            >
                {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                ) : (
                    <Link2 className="h-4 w-4" />
                )}
            </Button>
        </div>
    );
}
