
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, ExternalLink, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
    { value: "ai", label: "AI" },
    { value: "gadget", label: "가젯" },
    { value: "software", label: "소프트웨어" },
    { value: "smartphone", label: "스마트폰" },
    { value: "laptop", label: "노트북" },
    { value: "audio", label: "오디오" },
    { value: "gaming", label: "게이밍" },
    { value: "general", label: "기타" },
];

export default function EditProductPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [form, setForm] = useState({
        name: "",
        price: "",
        imageUrl: "",
        affiliateUrl: "",
        category: "general",
        description: "",
    });

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch(`/api/admin/products/${params.id}`);
                const data = await res.json();
                if (data.success) {
                    const product = data.product;
                    setForm({
                        name: product.name,
                        price: product.price?.toString() || "",
                        imageUrl: product.imageUrl || "",
                        affiliateUrl: product.affiliateUrl || "",
                        category: product.category || "general",
                        description: product.description || "",
                    });
                } else {
                    alert("상품 정보를 불러오지 못했습니다.");
                    router.push("/admin/products");
                }
            } catch (error) {
                console.error(error);
                alert("오류가 발생했습니다.");
            } finally {
                setInitialLoading(false);
            }
        };

        fetchProduct();
    }, [params.id, router]);

    const fetchAiContent = async () => {
        if (!form.name.trim()) {
            alert("상품명을 먼저 입력해주세요");
            return;
        }

        setFetchLoading(true);
        try {
            const res = await fetch("/api/admin/products/generate-ai-content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productName: form.name }),
            });

            const data = await res.json();

            if (data.success) {
                if (confirm("AI가 생성한 내용으로 현재 내용을 덮어쓰시겠습니까?")) {
                    setForm(prev => ({
                        ...prev,
                        name: data.data.title || prev.name,
                        description: data.data.content || prev.description,
                    }));
                }
            } else {
                alert(data.error || "AI 생성에 실패했습니다.");
            }
        } catch (error) {
            console.error(error);
            alert("API 호출 중 오류가 발생했습니다.");
        } finally {
            setFetchLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name.trim()) {
            alert("상품명을 입력해주세요.");
            return;
        }

        if (!form.affiliateUrl.trim()) {
            alert("쿠팡 파트너스 링크를 입력해주세요.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`/api/admin/products/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name.trim(),
                    price: parseInt(form.price) || 0,
                    imageUrl: form.imageUrl.trim(),
                    affiliateUrl: form.affiliateUrl.trim(),
                    category: form.category,
                    description: form.description.trim(),
                }),
            });

            const data = await res.json();

            if (data.success) {
                alert("상품이 수정되었습니다!");
                router.push("/admin/products");
            } else {
                alert(data.error || "상품 수정에 실패했습니다.");
            }
        } catch (error) {
            alert("오류가 발생했습니다. 다시 시도해주세요.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("정말 이 상품을 삭제하시겠습니까?")) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/admin/products/${params.id}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (data.success) {
                alert("상품이 삭제되었습니다.");
                router.push("/admin/products");
            } else {
                alert(data.error || "삭제 실패");
            }
        } catch (error) {
            alert("오류 발생");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/products"
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            상품 수정
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            등록된 PICKS 상품을 수정합니다
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                    <Trash2 className="h-4 w-4" />
                    삭제
                </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="max-w-2xl">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 space-y-6">
                    {/* 상품명 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            상품명 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="예: 삼성 갤럭시 S25 울트라"
                                className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-700 dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={fetchAiContent}
                                disabled={fetchLoading || !form.name.trim()}
                                className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                            >
                                {fetchLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    <Sparkles className="h-4 w-4" />
                                )}
                                AI 자동 완성
                            </button>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            상품명을 입력하고 버튼을 누르면 제목과 설명을 AI가 다시 작성해줍니다.
                        </p>
                    </div>

                    {/* 가격 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            가격 (원)
                        </label>
                        <input
                            type="number"
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                            placeholder="예: 1500000"
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-700 dark:text-white"
                        />
                    </div>

                    {/* 쿠팡 파트너스 링크 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            쿠팡 파트너스 링크 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="url"
                            value={form.affiliateUrl}
                            onChange={(e) => setForm({ ...form, affiliateUrl: e.target.value })}
                            placeholder="https://link.coupang.com/..."
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-700 dark:text-white"
                        />
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            <a
                                href="https://partners.coupang.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                                쿠팡 파트너스에서 링크 생성하기
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </p>
                    </div>

                    {/* 이미지 URL */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            상품 이미지 URL
                        </label>
                        <input
                            type="url"
                            value={form.imageUrl}
                            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                            placeholder="https://..."
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-700 dark:text-white"
                        />
                        {form.imageUrl && (
                            <div className="mt-3">
                                <img
                                    src={form.imageUrl}
                                    alt="Preview"
                                    className="h-32 w-auto object-cover rounded-lg border"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* 카테고리 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            카테고리
                        </label>
                        <select
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-700 dark:text-white"
                        >
                            {CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 설명 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            상품 설명 (선택)
                        </label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={3}
                            placeholder="상품에 대한 간단한 설명..."
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-700 dark:text-white resize-none"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <div className="mt-6 flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                수정 중...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                수정 완료
                            </>
                        )}
                    </button>
                    <Link
                        href="/admin/products"
                        className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        취소
                    </Link>
                </div>
            </form>
        </>
    );
}
