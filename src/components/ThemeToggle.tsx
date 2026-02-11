"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <button
                className="relative w-14 h-7 rounded-full bg-slate-200 transition-colors"
                aria-label="테마 전환"
            >
                <div className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm" />
            </button>
        );
    }

    const isDark = theme === "dark";

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`
                relative w-14 h-7 rounded-full transition-all duration-500 ease-in-out
                ${isDark
                    ? "bg-indigo-900 shadow-inner shadow-indigo-950"
                    : "bg-sky-300 shadow-inner shadow-sky-400/30"
                }
            `}
            aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
            title={isDark ? "라이트 모드" : "다크 모드"}
        >
            {/* Stars (visible in dark mode) */}
            <div className={`absolute inset-0 overflow-hidden rounded-full transition-opacity duration-500 ${isDark ? "opacity-100" : "opacity-0"}`}>
                <div className="absolute top-1 left-2 w-1 h-1 bg-white rounded-full animate-pulse" />
                <div className="absolute top-3 left-5 w-0.5 h-0.5 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />
                <div className="absolute top-1.5 left-8 w-0.5 h-0.5 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
            </div>

            {/* Clouds (visible in light mode) */}
            <div className={`absolute inset-0 overflow-hidden rounded-full transition-opacity duration-500 ${isDark ? "opacity-0" : "opacity-100"}`}>
                <div className="absolute top-3.5 left-1.5 w-3 h-1.5 bg-white/60 rounded-full" />
                <div className="absolute top-2 left-3 w-2 h-1 bg-white/40 rounded-full" />
            </div>

            {/* Toggle Circle (Sun/Moon) */}
            <div
                className={`
                    absolute top-0.5 w-6 h-6 rounded-full
                    transition-all duration-500 ease-in-out
                    flex items-center justify-center
                    ${isDark
                        ? "left-[calc(100%-1.625rem)] bg-slate-200 shadow-md shadow-indigo-500/30"
                        : "left-0.5 bg-amber-300 shadow-md shadow-amber-500/40"
                    }
                `}
            >
                {isDark ? (
                    // Moon
                    <svg className="w-3.5 h-3.5 text-indigo-800" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                    </svg>
                ) : (
                    // Sun
                    <svg className="w-3.5 h-3.5 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                    </svg>
                )}
            </div>
        </button>
    );
}
