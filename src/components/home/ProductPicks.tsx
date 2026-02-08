import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProducts } from "@/lib/coupang";

export async function ProductPicks() {
    // 실제 DB(WordPress)에서 상품 가져오기
    const products = await getProducts();

    // 상품이 없으면 섹션을 숨김
    if (products.length === 0) {
        return null; // 또는 "준비 중" 표시
    }

    // 상위 4개만 표시
    const featuredProducts = products.slice(0, 4);

    return (
        <section className="py-16 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
                            PICKS
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                            에디터가 엄선한 추천 제품
                        </p>
                    </div>
                    <Link
                        href="/picks"
                        className="group flex items-center gap-2 text-primary font-semibold hover:underline"
                    >
                        전체 보기
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {featuredProducts.map((product) => (
                        <a
                            key={product.id}
                            href={product.affiliateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block"
                        >
                            {/* Image */}
                            <div className="relative h-32 md:h-40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600">
                                {product.imageUrl ? (
                                    <Image
                                        src={product.imageUrl}
                                        alt={product.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                                        No Image
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="font-bold text-sm md:text-base text-slate-900 dark:text-white line-clamp-1">
                                    {product.name}
                                </h3>
                                <p className="text-primary font-bold mt-1">
                                    ₩{product.price.toLocaleString()}
                                </p>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
