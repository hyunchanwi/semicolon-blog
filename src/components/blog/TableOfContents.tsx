"use client";

import { useState, useEffect, useCallback } from "react";
import { List, X } from "lucide-react";

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
            const offset = 100;
            const top = el.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: "smooth" });
            setActiveId(id);
            setIsOpen(false);
        }
    }, []);

    if (items.length < 2) return null;

    return (
        <>
            {/* ===== 데스크탑: Sticky 사이드바 ===== */}
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

            {/* ===== 모바일: 플로팅 버튼 + 오버레이 ===== */}
            <div className="lg:hidden">
                {/* 플로팅 버튼 (우하단 고정) */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center transition-all duration-300 active:scale-90"
                    aria-label="목차 열기"
                >
                    {isOpen ? (
                        <X className="w-5 h-5" />
                    ) : (
                        <List className="w-5 h-5" />
                    )}
                </button>

                {/* 오버레이 목차 */}
                {isOpen && (
                    <>
                        {/* 배경 딤 */}
                        <div
                            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* 바텀시트 */}
                        <div className="fixed bottom-0 left-0 right-0 z-40 max-h-[60vh] bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl border-t border-slate-200 dark:border-slate-700 animate-in slide-in-from-bottom duration-300 overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                    <List className="w-4 h-4" />
                                    목차
                                </h4>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <X className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>

                            <nav className="overflow-y-auto max-h-[calc(60vh-4rem)] px-4 py-3">
                                <ul className="space-y-1">
                                    {items.map((item) => (
                                        <li key={item.id}>
                                            <button
                                                onClick={() => handleClick(item.id)}
                                                className={`
                                                    w-full text-left text-sm py-2.5 px-3 rounded-lg transition-all
                                                    ${item.level === 3 ? "pl-7" : ""}
                                                    ${activeId === item.id
                                                        ? "text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-900/20"
                                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
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
                    </>
                )}
            </div>
        </>
    );
}
