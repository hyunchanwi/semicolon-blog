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

    const shareToFacebook = () => {
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
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

            {/* Facebook */}
            <Button
                variant="outline"
                size="icon"
                onClick={shareToFacebook}
                className="rounded-full w-9 h-9 bg-[#1877F2] hover:bg-[#0C63D4] border-0 text-white"
                title="Facebook 공유"
            >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
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
