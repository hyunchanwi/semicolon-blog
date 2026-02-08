import Image from "next/image";
import Link from "next/link";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProducts } from "@/lib/coupang";

export const metadata = {
    title: "PICKS - 에디터 추천",
    description: "Semicolon 에디터가 엄선한 최고의 테크 제품들",
};

// 이 페이지는 동적으로 렌더링되어야 함 (DB 조회)
export const dynamic = 'force-dynamic';

const categoryLabels: Record<string, string> = {
    gadget: "가젯",
    ai: "AI",
    software: "소프트웨어",
    general: "일반"
};

export default async function PicksPage() {
    const products = await getProducts();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Hero */}
            <section className="py-20 px-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent mb-6">
                        PICKS
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                        Semicolon 에디터가 직접 사용하고 추천하는 제품들
                    </p>
                </div>
            </section>

            {/* Products Grid */}
            <section className="py-12 px-4">
                <div className="max-w-7xl mx-auto">
                    {products.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {products.map((product) => (
                                <div
                                    key={product.id}
                                    className="group bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100 dark:border-slate-700"
                                >
                                    {/* Image */}
                                    <div className="relative h-64 bg-slate-100 dark:bg-slate-700 overflow-hidden">
                                        {product.imageUrl ? (
                                            <Image
                                                src={product.imageUrl}
                                                alt={product.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                No Image
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <span className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full text-xs font-bold text-primary shadow-sm">
                                                {categoryLabels[product.category] || product.category}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 h-14">
                                            {product.name}
                                        </h3>
                                        {product.description && (
                                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2 h-10">
                                                {product.description}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between mt-4">
                                            <span className="text-2xl font-black text-slate-900 dark:text-white">
                                                {product.price > 0 ? `₩${product.price.toLocaleString()}` : '가격 정보 없음'}
                                            </span>

                                            {product.affiliateUrl && (
                                                <Button
                                                    asChild
                                                    className="rounded-full bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all"
                                                >
                                                    <a
                                                        href={product.affiliateUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer nofollow"
                                                    >
                                                        구매하러 가기
                                                        <ExternalLink className="ml-2 h-4 w-4" />
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-xl text-slate-500">아직 등록된 추천 제품이 없습니다.</p>
                            <p className="text-slate-400 mt-2">관리자 페이지에서 첫 번째 상품을 등록해보세요!</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Disclaimer */}
            <section className="py-12 px-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                        이 페이지의 링크를 통해 구매하시면 Semicolon에 소정의 수수료가 지급됩니다.
                        이는 더 좋은 콘텐츠 제작에 도움이 됩니다. (쿠팡 파트너스 활동의 일환)
                    </p>
                </div>
            </section>
        </div>
    );
}
