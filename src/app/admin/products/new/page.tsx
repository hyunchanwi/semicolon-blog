"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, ExternalLink } from "lucide-react";
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

export default function NewProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: "",
        price: "",
        imageUrl: "",
        affiliateUrl: "",
        category: "general",
        description: "",
    });

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
            const res = await fetch("/api/admin/products", {
                method: "POST",
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
                alert("상품이 등록되었습니다!");
                router.push("/admin/products");
            } else {
                alert(data.error || "상품 등록에 실패했습니다.");
            }
        } catch (error) {
            alert("오류가 발생했습니다. 다시 시도해주세요.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/admin/products"
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        새 상품 등록
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        쿠팡 파트너스 상품을 등록합니다
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="max-w-2xl">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 space-y-6">
                    {/* 상품명 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            상품명 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="예: 삼성 갤럭시 S25 울트라"
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-700 dark:text-white"
                        />
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
                                등록 중...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                상품 등록
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

            {/* Tip */}
            <div className="mt-8 max-w-2xl p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                    💡 쿠팡 파트너스 링크 만드는 법
                </h4>
                <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                    <li>쿠팡 파트너스 사이트 접속</li>
                    <li>상품 검색 → 원하는 상품 찾기</li>
                    <li>"링크 생성" 버튼 클릭</li>
                    <li>생성된 링크를 위 입력란에 붙여넣기</li>
                </ol>
            </div>
        </>
    );
}
