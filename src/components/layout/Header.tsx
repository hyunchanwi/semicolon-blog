"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { GoogleTranslate, useLanguageSwitch } from "@/components/GoogleTranslate";
import { LoginButton } from "@/components/auth/LoginButton";
import { ThemeToggle } from "@/components/ThemeToggle";

const navLinks = [
    { href: "/", label: "홈" },
    { href: "/blog", label: "블로그" },
    { href: "/category/technology", label: "테크" },
    { href: "/category/gadget", label: "가젯" },
    { href: "/category/apps", label: "앱" },
    { href: "/category/software", label: "소프트웨어" },
];

export const Header = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isBlogExpanded, setIsBlogExpanded] = useState(false);
    const { switchToKorean, switchToEnglish } = useLanguageSwitch();

    // Grouped categories for dropdown
    const blogCategories = [
        { href: "/category/technology", label: "테크", icon: "💻" },
        { href: "/category/how-to", label: "사용법", icon: "📝" },
        { href: "/category/ai", label: "AI", icon: "🤖" },
        { href: "/category/gadget", label: "가젯", icon: "📱" },
        { href: "/category/games", label: "게임", icon: "🎮" },
        { href: "/category/apps", label: "앱", icon: "📲" },
        { href: "/category/software", label: "소프트웨어", icon: "⚙️" },
        { href: "/category/other", label: "기타", icon: "🎸" },
    ];

    return (
        <>
            <GoogleTranslate />
            <header className="fixed top-0 left-0 right-0 z-50 glass-solid border-b border-white/20 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 md:h-20">
                        {/* Logo */}
                        <Link
                            href="/"
                            className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 hover:to-primary transition-all duration-300"
                        >
                            Semicolon;
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-2">
                            <Link
                                href="/"
                                className="px-5 py-2.5 rounded-full text-slate-600 dark:text-slate-300 font-medium hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 transform hover:-translate-y-0.5"
                            >
                                홈
                            </Link>

                            {/* Dropdown for Blog */}
                            <div className="relative group">
                                <Link
                                    href="/blog"
                                    className="px-5 py-2.5 rounded-full text-slate-600 dark:text-slate-300 font-medium hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 transform hover:-translate-y-0.5 inline-flex items-center gap-1"
                                >
                                    블로그 <ChevronDown className="h-4 w-4 ml-0.5" />
                                </Link>
                                {/* Dropdown Menu */}
                                <div className="absolute top-full left-0 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/50 p-2 flex flex-col gap-1 overflow-hidden">
                                        {blogCategories.map((cat) => (
                                            <Link
                                                key={cat.href}
                                                href={cat.href}
                                                className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 transition-colors text-sm font-medium"
                                            >
                                                {cat.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* PICKS Link */}
                            <Link
                                href="/picks"
                                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary font-bold hover:from-primary/20 hover:to-purple-500/20 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                            >
                                PICKS
                            </Link>
                        </nav>

                        {/* Language Buttons + Theme Toggle (Desktop) */}
                        <div className="hidden md:flex items-center gap-2">
                            <ThemeToggle />
                            <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-full backdrop-blur-sm">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-full px-4 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm h-8 text-xs font-medium text-slate-600 dark:text-slate-300"
                                    onClick={switchToKorean}
                                >
                                    한국어
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-full px-4 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm h-8 text-xs font-medium text-slate-600 dark:text-slate-300"
                                    onClick={switchToEnglish}
                                >
                                    English
                                </Button>
                            </div>
                            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2" />
                            <LoginButton />
                        </div>

                        {/* Mobile Menu */}
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild className="md:hidden">
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
                                    <Menu className="h-6 w-6 text-slate-700" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="glass-solid w-full sm:w-[350px] p-0 border-l border-white/20">
                                <div className="h-full flex flex-col bg-white/60 backdrop-blur-xl">
                                    <div className="p-6 pt-12 flex-1 overflow-y-auto">
                                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 px-2">Menu</h2>

                                        <div className="flex flex-col gap-3">
                                            {/* Home Link */}
                                            <Link
                                                href="/"
                                                onClick={() => setIsOpen(false)}
                                                className="group px-6 py-4 rounded-3xl text-lg font-bold text-slate-800 bg-white/50 border border-white/40 hover:bg-gradient-to-r hover:from-slate-50 hover:to-white hover:shadow-lg transition-all duration-300 transform active:scale-95 flex items-center gap-3"
                                            >
                                                <span className="text-2xl">🏠</span>
                                                <span className="group-hover:translate-x-1 transition-transform duration-300">Home</span>
                                            </Link>

                                            {/* Blog with Expandable Categories */}
                                            <div className="rounded-3xl bg-white/50 border border-white/40 overflow-hidden transition-all duration-300">
                                                <button
                                                    onClick={() => setIsBlogExpanded(!isBlogExpanded)}
                                                    className="w-full px-6 py-4 text-lg font-bold text-slate-800 hover:bg-gradient-to-r hover:from-slate-50 hover:to-white hover:shadow-lg transition-all duration-300 flex items-center justify-between group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">📚</span>
                                                        <span className="group-hover:translate-x-1 transition-transform duration-300">Blog</span>
                                                    </div>
                                                    <ChevronDown
                                                        className={`h-5 w-5 transition-transform duration-300 ${isBlogExpanded ? 'rotate-180' : ''}`}
                                                    />
                                                </button>

                                                {/* Expandable Categories */}
                                                <div
                                                    className={`transition-all duration-500 ease-in-out ${isBlogExpanded
                                                        ? 'max-h-96 opacity-100'
                                                        : 'max-h-0 opacity-0'
                                                        } overflow-hidden`}
                                                >
                                                    <div className="px-3 py-3 space-y-2 bg-gradient-to-b from-slate-50/50 to-transparent">
                                                        {blogCategories.map((cat, index) => (
                                                            <Link
                                                                key={cat.href}
                                                                href={cat.href}
                                                                onClick={() => {
                                                                    setIsOpen(false);
                                                                    setIsBlogExpanded(false);
                                                                }}
                                                                className="group flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-700 hover:bg-gradient-to-r hover:from-white hover:to-slate-50 hover:shadow-md transition-all duration-300 transform hover:translate-x-2 active:scale-95"
                                                                style={{
                                                                    transitionDelay: isBlogExpanded ? `${index * 50}ms` : '0ms'
                                                                }}
                                                            >
                                                                <span className="text-xl">{cat.icon}</span>
                                                                <span className="font-medium group-hover:text-primary transition-colors">
                                                                    {cat.label}
                                                                </span>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 border-t border-slate-100 bg-white/40 backdrop-blur-sm">
                                        <div className="flex gap-2 mb-6">
                                            <Button
                                                variant="outline"
                                                className="flex-1 rounded-2xl h-12 text-base font-medium border-slate-200"
                                                onClick={switchToKorean}
                                            >
                                                🇰🇷 한국어
                                            </Button>
                                            <Button
                                                className="flex-1 rounded-2xl h-12 text-base font-medium bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                                                onClick={switchToEnglish}
                                            >
                                                🇺🇸 English
                                            </Button>
                                        </div>
                                        <LoginButton />
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>
        </>
    );
};
