import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    basePath: string;
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
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
        <div className="flex justify-center items-center gap-2 mt-12 select-none">
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
    );
}
