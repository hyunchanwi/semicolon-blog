import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, Plus } from "lucide-react";
import { getCategories } from "@/lib/wp-api";

export default async function CategoriesPage() {
    const categories = await getCategories();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-900">카테고리 관리</h1>
                <Button className="rounded-xl bg-slate-900 hover:bg-slate-800" disabled>
                    <Plus className="h-4 w-4 mr-2" />
                    카테고리 추가 (워드프레스에서 관리)
                </Button>
            </div>

            <Card className="rounded-2xl border-0 shadow-md">
                <CardHeader>
                    <CardTitle>전체 카테고리 ({categories.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>이름</TableHead>
                                <TableHead>슬러그</TableHead>
                                <TableHead>글 개수</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <FolderOpen className="h-4 w-4 text-violet-500" />
                                            {category.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-500">{category.slug}</TableCell>
                                    <TableCell>{category.count}</TableCell>
                                </TableRow>
                            ))}
                            {categories.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-32 text-slate-500">
                                        카테고리가 없습니다.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
