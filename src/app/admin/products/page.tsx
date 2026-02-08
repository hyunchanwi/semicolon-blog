"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, ExternalLink, Package } from "lucide-react";

interface Product {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
    affiliateUrl: string;
    category: string;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<number | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/admin/products");
            const data = await res.json();
            if (data.success) {
                setProducts(data.products);
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("정말 이 상품을 삭제하시겠습니까?")) return;

        setDeleting(id);
        try {
            const res = await fetch(`/api/admin/products/${id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success) {
                setProducts(products.filter((p) => p.id !== id));
            } else {
                alert("삭제에 실패했습니다.");
            }
        } catch (error) {
            alert("삭제 중 오류가 발생했습니다.");
        } finally {
            setDeleting(null);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("ko-KR").format(price);
    };

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Package className="h-6 w-6" />
                        상품 관리
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        쿠팡 파트너스 추천 상품을 관리합니다
                    </p>
                </div>
                <Link
                    href="/admin/products/new"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    새 상품 등록
                </Link>
            </div>

            {/* Products Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl">
                    <Package className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                        등록된 상품이 없습니다
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        쿠팡 파트너스 상품을 등록해보세요!
                    </p>
                    <Link
                        href="/admin/products/new"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        첫 상품 등록하기
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                            {/* Product Image */}
                            <div className="aspect-video bg-slate-100 dark:bg-slate-700 relative">
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <Package className="h-12 w-12 text-slate-300" />
                                    </div>
                                )}
                                <span className="absolute top-2 right-2 px-2 py-1 bg-slate-900/70 text-white text-xs rounded">
                                    {product.category}
                                </span>
                            </div>

                            {/* Product Info */}
                            <div className="p-4">
                                <h3 className="font-medium text-slate-900 dark:text-white mb-1 line-clamp-2">
                                    {product.name}
                                </h3>
                                <p className="text-lg font-bold text-primary mb-4">
                                    ₩{formatPrice(product.price)}
                                </p>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <a
                                        href={product.affiliateUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        쿠팡에서 보기
                                    </a>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        disabled={deleting === product.id}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Coupang Disclaimer */}
            <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                    ※ 이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
                </p>
            </div>
        </>
    );
}
