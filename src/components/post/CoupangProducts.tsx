"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, ExternalLink } from "lucide-react";

interface Product {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
    affiliateUrl: string;
    category: string;
}

interface CoupangProductsProps {
    category?: string;
    maxProducts?: number;
}

/**
 * 블로그 글 하단에 표시되는 쿠팡 파트너스 상품 추천 컴포넌트
 */
export function CoupangProducts({ category, maxProducts = 3 }: CoupangProductsProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, [category]);

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/admin/products");
            const data = await res.json();

            if (data.success && data.products) {
                let filtered = data.products;

                // 카테고리 필터링
                if (category) {
                    filtered = filtered.filter((p: Product) => p.category === category);
                }

                // 카테고리에 해당하는 상품이 없으면 전체에서 랜덤 선택
                if (filtered.length === 0) {
                    filtered = data.products;
                }

                // 랜덤 셔플 후 maxProducts만큼 선택
                const shuffled = filtered.sort(() => 0.5 - Math.random());
                setProducts(shuffled.slice(0, maxProducts));
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("ko-KR").format(price);
    };

    // 상품이 없거나 로딩 중이면 표시 안함
    if (loading || products.length === 0) {
        return null;
    }

    return (
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    이 글과 관련된 추천 상품
                </h3>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((product) => (
                    <a
                        key={product.id}
                        href={product.affiliateUrl}
                        target="_blank"
                        rel="noopener sponsored"
                        className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                        {/* Product Image */}
                        <div className="aspect-square bg-slate-100 dark:bg-slate-700 relative overflow-hidden">
                            {product.imageUrl ? (
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <ShoppingCart className="h-12 w-12 text-slate-300" />
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="p-4">
                            <h4 className="font-medium text-slate-900 dark:text-white text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                                {product.name}
                            </h4>
                            <p className="text-lg font-bold text-primary mb-3">
                                ₩{formatPrice(product.price)}
                            </p>
                            <span className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">
                                쿠팡에서 보기
                                <ExternalLink className="h-3 w-3" />
                            </span>
                        </div>
                    </a>
                ))}
            </div>

            {/* Disclaimer */}
            <p className="mt-6 text-xs text-slate-400 dark:text-slate-500 text-center">
                ※ 이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
            </p>
        </div>
    );
}
