"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FileText,
    Plus,
    FolderOpen,
    Settings,
    Home,
    Package
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarLinks = [
    { href: "/admin", label: "대시보드", icon: LayoutDashboard },
    { href: "/admin/posts", label: "글 관리", icon: FileText },
    { href: "/admin/posts/new", label: "새 글 작성", icon: Plus },
    { href: "/admin/categories", label: "카테고리", icon: FolderOpen },
    { href: "/admin/products", label: "상품 관리", icon: Package },
];

export const AdminSidebar = () => {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-slate-900 text-white min-h-screen p-4">
            {/* Logo */}
            <div className="mb-8 px-2">
                <Link href="/" className="text-xl font-bold flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Semicolon;
                </Link>
                <p className="text-slate-400 text-sm mt-1">관리자 패널</p>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
                {sidebarLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href ||
                        (link.href !== "/admin" && pathname?.startsWith(link.href));

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
                                isActive
                                    ? "bg-white/10 text-white"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="absolute bottom-4 left-4 right-4 space-y-2">
                <Link
                    href="https://royalblue-anteater-980825.hostingersite.com/wp-admin"
                    target="_blank"
                    className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white transition-colors hover:bg-white/5 rounded-lg"
                >
                    <Settings className="h-4 w-4" />
                    WordPress 관리자
                </Link>
                <Link
                    href="/"
                    className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white transition-colors hover:bg-white/5 rounded-lg"
                >
                    <Home className="h-4 w-4" />
                    사이트로 돌아가기
                </Link>
            </div>
        </aside>
    );
};
