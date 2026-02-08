"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { WPCategory } from "@/lib/wp-api";

interface CategoryFilterProps {
    categories: WPCategory[];
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentCategory = searchParams.get("category") || "all";

    const handleValueChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value === "all") {
            params.delete("category");
        } else {
            params.set("category", value);
        }
        router.push(`/admin/posts?${params.toString()}`);
    };

    return (
        <Select value={currentCategory} onValueChange={handleValueChange}>
            <SelectTrigger className="w-[180px] rounded-xl bg-white">
                <SelectValue placeholder="카테고리 선택" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">전체 보기</SelectItem>
                {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
