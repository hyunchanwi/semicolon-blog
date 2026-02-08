"use client";

import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface QuickCategorySelectProps {
    postId: number;
    currentCategoryId: number | null;
    categories: { id: number; name: string }[];
}

export function QuickCategorySelect({
    postId,
    currentCategoryId,
    categories,
}: QuickCategorySelectProps) {
    const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState<string>(
        currentCategoryId?.toString() || ""
    );
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = async (newCategoryId: string) => {
        if (newCategoryId === selectedCategory) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/posts/${postId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    categories: [parseInt(newCategoryId)],
                }),
            });

            if (!res.ok) throw new Error("Failed to update");

            setSelectedCategory(newCategoryId);
            router.refresh(); // 서버 데이터와 동기화
        } catch (e) {
            alert("카테고리 변경 실패");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-1">
            {isLoading && <Loader2 className="h-3 w-3 animate-spin text-slate-400" />}
            <Select
                value={selectedCategory}
                onValueChange={handleChange}
                disabled={isLoading}
            >
                <SelectTrigger className="h-7 w-24 text-xs border-slate-200 bg-white">
                    <SelectValue placeholder="미분류" />
                </SelectTrigger>
                <SelectContent>
                    {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()} className="text-xs">
                            {cat.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
