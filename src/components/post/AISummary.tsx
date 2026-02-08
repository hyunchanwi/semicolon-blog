"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AISummaryProps {
    postId: number;
    content: string;
    savedSummary?: string; // 저장된 요약 (있으면 바로 표시)
}

export function AISummary({ postId, content, savedSummary }: AISummaryProps) {
    const [summary, setSummary] = useState<string | null>(savedSummary || null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 저장된 요약이 있으면 자동으로 표시
    useEffect(() => {
        if (savedSummary) {
            setSummary(savedSummary);
        }
    }, [savedSummary]);

    const generateSummary = async () => {
        // 이미 요약이 있으면 토글만
        if (summary) {
            setIsExpanded(!isExpanded);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ postId, content }), // postId 전달
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "요약 생성 실패");
            }

            setSummary(data.summary);
            setIsExpanded(true);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 저장된 요약이 있으면 바로 표시
    if (savedSummary && summary) {
        return (
            <div className="mb-8">
                <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-indigo-500" />
                        <span className="font-bold text-indigo-700 dark:text-indigo-300 text-sm">AI 요약</span>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        {summary.split('\n').map((line, idx) => (
                            <p key={idx} className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed my-1">
                                {line}
                            </p>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // 저장된 요약이 없으면 버튼 표시 (기존 글 호환)
    return (
        <div className="mb-8">
            <Button
                onClick={generateSummary}
                disabled={isLoading}
                variant="outline"
                className="gap-2 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900 dark:hover:to-purple-900 transition-all"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        요약 생성 중...
                    </>
                ) : summary ? (
                    <>
                        <Sparkles className="h-4 w-4" />
                        AI 요약
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </>
                ) : (
                    <>
                        <Sparkles className="h-4 w-4" />
                        🤖 AI로 요약 보기
                    </>
                )}
            </Button>

            {error && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {summary && isExpanded && (
                <div className="mt-4 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 rounded-2xl border border-indigo-100 dark:border-indigo-800 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-indigo-500" />
                        <span className="font-bold text-indigo-700 dark:text-indigo-300 text-sm">AI 요약</span>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        {summary.split('\n').map((line, idx) => (
                            <p key={idx} className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed my-1">
                                {line}
                            </p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
