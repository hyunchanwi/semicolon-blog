"use client";

import { AISummary } from "@/components/post/AISummary";

interface AISummaryWrapperProps {
    postId: number;
    content: string;
    savedSummary?: string;
}

export function AISummaryWrapper({ postId, content, savedSummary }: AISummaryWrapperProps) {
    return <AISummary postId={postId} content={content} savedSummary={savedSummary} />;
}
