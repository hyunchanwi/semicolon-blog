"use client";

import { useState } from "react";
import { TableOfContents, TocItem } from "./TableOfContents";
import { GoogleAdUnit } from "@/components/ads/GoogleAdUnit";
import { splitContentForAds } from "@/lib/ads";
import { ChevronRight, List } from "lucide-react";

interface PostContentLayoutProps {
    content: string;
    toc: TocItem[];
    hasToc: boolean;
}

export function PostContentLayout({ content, toc, hasToc }: PostContentLayoutProps) {
    // 모바일에서는 항상 false (어차피 hidden), 데스크탑 초기값 true
    const [isTocOpen, setIsTocOpen] = useState(true);

    // 광고 분리
    const { firstHalf, secondHalf } = splitContentForAds(content);

    if (!hasToc) {
        return (
            <div className="max-w-4xl mx-auto">
                <ContentRenderer firstHalf={firstHalf} secondHalf={secondHalf} />
            </div>
        );
    }

    return (
        <div className={`relative transition-all duration-300 ease-in-out ${isTocOpen ? 'lg:max-w-7xl' : 'lg:max-w-4xl'} max-w-4xl mx-auto px-4 sm:px-6 lg:px-8`}>
            {/* 
               모바일: block (flex 안씀) -> 본문 100% 너비
               데스크탑: flex -> 본문 + 사이드바 
            */}
            <div className="block lg:flex lg:gap-8 lg:items-start">

                {/* Main Content */}
                <div
                    className="prose prose-xl prose-slate dark:prose-invert max-w-none w-full lg:flex-1 lg:min-w-0
                    prose-headings:font-bold prose-headings:text-slate-900 prose-headings:tracking-tight
                    prose-p:text-slate-800 prose-p:leading-8 prose-p:text-[1.125rem] md:prose-p:text-[1.2rem]
                    prose-li:text-slate-800 prose-li:text-[1.125rem] md:prose-li:text-[1.2rem]
                    prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
                    prose-img:rounded-3xl prose-img:shadow-lg prose-img:my-10
                    prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-indigo-600 prose-code:font-semibold
                    prose-pre:bg-slate-900 prose-pre:rounded-2xl
                    [&>h2]:text-3xl [&>h2]:mt-12 [&>h2]:mb-6
                    [&>h3]:text-2xl [&>h3]:mt-10 [&>h3]:mb-4"
                >
                    <ContentRenderer firstHalf={firstHalf} secondHalf={secondHalf} />
                </div>

                {/* Desktop TOC Sidebar (Mobile: Hidden) */}
                <div className={`
                    hidden lg:block sticky top-28 transition-all duration-300 ease-in-out shrink-0
                    ${isTocOpen ? 'w-64 opacity-100 translate-x-0' : 'w-12'}
                `}>
                    {isTocOpen ? (
                        <div className="relative">
                            <button
                                onClick={() => setIsTocOpen(false)}
                                className="absolute -left-3 top-0 p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors z-10"
                                title="목차 접기"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <TableOfContents items={toc} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <button
                                onClick={() => setIsTocOpen(true)}
                                className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors shadow-sm"
                                title="목차 펼치기"
                            >
                                <List className="w-5 h-5" />
                            </button>
                            <span className="mt-2 text-xs font-medium text-slate-400 writing-vertical-rl tracking-widest uppercase select-none">
                                목차
                            </span>
                        </div>
                    )}
                </div>

                {/* Mobile TOC Floating Button is handled inside TableOfContents component (hidden lg:block there) but wait, 
                   TableOfContents component has "hidden lg:block" for sidebar and "lg:hidden" for floating button.
                   So we just need to render TableOfContents somewhere for mobile. 
                   But here inside this div it's "hidden lg:block". 
                   So we need to render TableOfContents outside for mobile.
                */}
            </div>

            {/* Mobile TOC Instance (Floating Button) */}
            <div className="lg:hidden">
                <TableOfContents items={toc} />
            </div>
        </div>
    );
}

function ContentRenderer({ firstHalf, secondHalf }: { firstHalf: string, secondHalf: string }) {
    return (
        <>
            <div dangerouslySetInnerHTML={{ __html: firstHalf }} />
            {secondHalf && (
                <>
                    <div className="my-12">
                        <GoogleAdUnit
                            slotId="5212379301"
                            layout="in-article"
                            format="fluid"
                            className="w-full"
                        />
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: secondHalf }} />
                </>
            )}
        </>
    );
}
