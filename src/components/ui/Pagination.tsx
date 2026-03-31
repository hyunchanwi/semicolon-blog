"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    basePath: string;
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
    const router = useRouter();

    if (totalPages <= 1) return null;

    // Generate page numbers to display
    const getPageNumbers = () => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

        // If > 7
        // Default: 1 2 3 4 5 ... 10
        if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
        // End: 1 ... 6 7 8 9 10
        if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        // Middle: 1 ... 4 5 6 ... 10
        return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    };

    const pages = getPageNumbers();

    return (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-12 select-none">
            <div className="flex items-center gap-2">
                {/* Prev */}
                <Link
                    href={currentPage <= 1 ? '#' : `${basePath}?page=${currentPage - 1}`}
                    className={cn(
                        "p-2 rounded-md transition-colors flex items-center justify-center",
                        currentPage <= 1
                            ? "text-slate-300 pointer-events-none"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                    aria-disabled={currentPage <= 1}
                    aria-label="Previous page"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Link>

                {pages.map((page, idx) => (
                    typeof page === 'number' ? (
                        <Link
                            key={page}
                            href={`${basePath}?page=${page}`}
                            className={cn(
                                "w-10 h-10 flex items-center justify-center rounded-md transition-colors text-sm",
                                currentPage === page
                                    ? "bg-slate-900 text-white font-medium shadow-sm"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            )}
                        >
                            {page}
                        </Link>
                    ) : (
                        <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">...</span>
                    )
                ))}

                {/* Next */}
                <Link
                    href={currentPage >= totalPages ? '#' : `${basePath}?page=${currentPage + 1}`}
                    className={cn(
                        "p-2 rounded-md transition-colors flex items-center justify-center",
                        currentPage >= totalPages
                            ? "text-slate-300 pointer-events-none"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                    aria-disabled={currentPage >= totalPages}
                    aria-label="Next page"
                >
                    <ChevronRight className="w-5 h-5" />
                </Link>
            </div>

            {/* Jump to Page Dropdown */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                <span className="text-sm font-medium text-slate-500 hidden sm:inline-block">이동:</span>
                <select
                    value={currentPage}
                    onChange={(e) => {
                        const page = Number(e.target.value);
                        router.push(`${basePath}?page=${page}`);
                    }}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_auto] bg-no-repeat bg-[position:right_10px_center]"
                >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                        <option key={`opt-${pageNum}`} value={pageNum}>
                            {pageNum} 페이지
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
