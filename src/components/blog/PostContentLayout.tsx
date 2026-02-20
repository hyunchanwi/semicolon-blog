"use client";

import { useState } from "react";
import { TableOfContents, TocItem } from "./TableOfContents";
import { GoogleAdUnit } from "@/components/ads/GoogleAdUnit";
import { splitContentForAds } from "@/lib/ads";
import { ChevronRight, PanelRightOpen, PanelRightClose } from "lucide-react";

interface PostContentLayoutProps {
    content: string;
    toc: TocItem[];
    hasToc: boolean;
}

export function PostContentLayout({ content, toc, hasToc }: PostContentLayoutProps) {
    const [isTocOpen, setIsTocOpen] = useState(true);

    const { firstHalf, secondHalf } = splitContentForAds(content);

    if (!hasToc) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <ContentRenderer firstHalf={firstHalf} secondHalf={secondHalf} />
            </div>
        );
    }

    return (
        <div className={`
            relative transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]
            ${isTocOpen ? 'lg:max-w-7xl' : 'lg:max-w-4xl'}
            max-w-4xl mx-auto px-4 sm:px-6 lg:px-8
        `}>
            {/* 
               [Layout Structure]
               Mobile: Block (stack)
               Desktop: Flex (side-by-side)
            */}
            <div className="block lg:flex lg:gap-10 lg:items-start relative">

                {/* Main Content */}
                <div
                    className="
                        prose prose-lg md:prose-xl prose-slate dark:prose-invert 
                        !w-full !max-w-full lg:flex-1 lg:min-w-0
                        prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-headings:tracking-tight
                        prose-p:text-slate-800 dark:prose-p:text-slate-300 prose-p:leading-relaxed 
                        prose-p:text-[1.125rem] md:prose-p:text-[1.2rem]
                        prose-li:text-slate-800 dark:prose-li:text-slate-300 prose-li:text-[1.125rem] md:prose-li:text-[1.2rem]
                        prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-a:break-all
                        prose-img:rounded-3xl prose-img:shadow-lg prose-img:my-10 prose-img:!w-full prose-img:!max-w-full prose-img:!h-auto
                        prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-indigo-600 dark:prose-code:text-indigo-400 prose-code:font-semibold
                        prose-pre:bg-slate-900 dark:prose-pre:bg-slate-900 prose-pre:rounded-2xl prose-pre:overflow-x-auto
                        [&>h2]:text-3xl [&>h2]:mt-12 [&>h2]:mb-6
                        [&>h3]:text-2xl [&>h3]:mt-10 [&>h3]:mb-4
                        [&>h4]:text-xl [&>h4]:mt-8 [&>h4]:mb-3
                        [&_iframe]:!w-full [&_iframe]:!max-w-full [&_video]:!w-full [&_video]:!max-w-full
                        [&_table]:block [&_table]:overflow-x-auto [&_table]:whitespace-nowrap
                        /* Hide empty paragraphs caused by copy-pasting from AI tools */
                        [&>p:empty]:hidden [&>p:has(br:only-child)]:hidden
                        break-words overflow-hidden
                    "
                >
                    <ContentRenderer firstHalf={firstHalf} secondHalf={secondHalf} />
                </div>

                {/* Desktop TOC Sidebar Wrapper */}
                <div className={`
                    hidden lg:block sticky top-28 transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] shrink-0
                    ${isTocOpen ? 'w-64 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-10 pointer-events-none'}
                `}>
                    <div className="relative w-64"> {/* Fixed width container inside */}
                        {/* Toggle Button (Inside sidebar when open) */}
                        <button
                            onClick={() => setIsTocOpen(false)}
                            className="absolute -left-4 top-0 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm z-10 hover:scale-110"
                            title="목차 접기"
                        >
                            <PanelRightClose className="w-4 h-4" />
                        </button>

                        <TableOfContents items={toc} />
                    </div>
                </div>

                {/* Re-open Button (Fixed/Sticky when sidebar is closed) */}
                <div className={`
                    hidden lg:block fixed bottom-10 right-10 z-30 transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]
                    ${!isTocOpen ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-10 scale-90 pointer-events-none'}
                `}>
                    <button
                        onClick={() => setIsTocOpen(true)}
                        className="
                            flex items-center gap-2 px-4 py-3 rounded-full 
                            bg-white dark:bg-slate-900 
                            text-slate-700 dark:text-slate-200 
                            shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]
                            border border-slate-100 dark:border-slate-800
                            hover:scale-105 hover:text-indigo-600 dark:hover:text-indigo-400
                            transition-all duration-300
                        "
                        title="목차 펼치기"
                    >
                        <PanelRightOpen className="w-5 h-5" />
                        <span className="font-semibold text-sm">목차 보기</span>
                    </button>
                </div>
            </div>

            {/* Mobile TOC Floating Button */}
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
