"use client";

import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeletePostButton({ id, title }: { id: number; title?: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/posts/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "삭제 실패");
            }

            setOpen(false);
            router.refresh();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="dark:bg-slate-900">
                <AlertDialogHeader>
                    <AlertDialogTitle className="dark:text-white">글 삭제</AlertDialogTitle>
                    <AlertDialogDescription className="dark:text-slate-400">
                        {title ? (
                            <>
                                <strong className="text-slate-900 dark:text-white">"{title}"</strong>을(를) 삭제하시겠습니까?
                            </>
                        ) : (
                            "이 글을 삭제하시겠습니까?"
                        )}
                        <br />
                        <span className="text-red-500">삭제된 글은 복구할 수 없습니다.</span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">
                        취소
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isLoading}
                        className="bg-red-500 hover:bg-red-600 text-white"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                삭제 중...
                            </>
                        ) : (
                            "삭제"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
