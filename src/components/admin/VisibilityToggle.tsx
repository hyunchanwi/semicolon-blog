
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface VisibilityToggleProps {
    postId: number;
    status: string;
}

export function VisibilityToggle({ postId, status }: VisibilityToggleProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const isPublished = status === 'publish';

    const toggleVisibility = async () => {
        if (isLoading) return;
        setIsLoading(true);

        const newStatus = isPublished ? 'draft' : 'publish';

        try {
            const res = await fetch(`/api/admin/posts/${postId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) throw new Error('Failed to update status');

            router.refresh();
        } catch (error) {
            console.error(error);
            alert('상태 변경 실패');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-lg ${!isPublished ? 'text-slate-400' : 'text-blue-600'}`}
                        onClick={toggleVisibility}
                        disabled={isLoading}
                    >
                        {isPublished ? (
                            <Eye className="h-4 w-4" />
                        ) : (
                            <EyeOff className="h-4 w-4" />
                        )}
                        <span className="sr-only">{isPublished ? '숨기기' : '보이기'}</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{isPublished ? '글 숨기기 (Draft)' : '글 보이기 (Publish)'}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
