"use client";

import { useState, useEffect, useCallback } from "react";

interface TocItem {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    items: TocItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
    const [activeId, setActiveId] = useState<string>("");
    const [isOpen, setIsOpen] = useState(false);

    // IntersectionObserver로 현재 읽고 있는 섹션 감지
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                }
            },
            {
                rootMargin: "-80px 0px -70% 0px",
                threshold: 0,
            }
        );

        items.forEach((item) => {
            const el = document.getElementById(item.id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [items]);

    const handleClick = useCallback((id: string) => {
        const el = document.getElementById(id);
        if (el) {
            const offset = 100; // 헤더 높이 고려
            const top = el.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: "smooth" });
            setActiveId(id);
            setIsOpen(false); // 모바일에서 클릭 후 닫기
        }
    }, []);

    if (items.length < 2) return null; // 항목이 2개 미만이면 표시 안 함

    return (
        <>
            {/* 모바일: 접이식 메뉴 */}
            <div className="lg:hidden mb-6">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                        목차
                    </span>
                    <svg
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isOpen && (
                    <nav className="mt-2 px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-in slide-in-from-top-2 duration-200">
                        <ul className="space-y-1.5">
                            {items.map((item) => (
                                <li key={item.id}>
                                    <button
                                        onClick={() => handleClick(item.id)}
                                        className={`
                                            w-full text-left text-sm py-1.5 transition-colors rounded-md px-2
                                            ${item.level === 3 ? "pl-6" : ""}
                                            ${activeId === item.id
                                                ? "text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20"
                                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                            }
                                        `}
                                    >
                                        {item.text}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                )}
            </div>

            {/* 데스크탑: Sticky 사이드바 */}
            <aside className="hidden lg:block sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto w-56 xl:w-64 shrink-0">
                <div className="px-4 py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                        목차
                    </h4>
                    <nav>
                        <ul className="space-y-1">
                            {items.map((item) => (
                                <li key={item.id}>
                                    <button
                                        onClick={() => handleClick(item.id)}
                                        className={`
                                            w-full text-left text-[13px] leading-snug py-1.5 px-2 rounded-md transition-all duration-150
                                            ${item.level === 3 ? "pl-5" : ""}
                                            ${activeId === item.id
                                                ? "text-blue-600 dark:text-blue-400 font-medium bg-blue-50/80 dark:bg-blue-900/20 border-l-2 border-blue-500"
                                                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                            }
                                        `}
                                    >
                                        {item.text}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            </aside>
        </>
    );
}
