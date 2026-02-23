"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const topics = [
    {
        title: "AI & Future",
        description: "인공지능의 혁신과 미래 전망을 심층적으로 다룹니다.",
        image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=600",
        href: "/category/ai",
        gradient: "from-blue-500 to-cyan-500",
        icon: "🤖",
    },
    {
        title: "Technology",
        description: "최신 기술 트렌드와 혁신을 빠르게 전달합니다.",
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600",
        href: "/category/technology",
        gradient: "from-indigo-500 to-blue-500",
        icon: "💻",
    },
    {
        title: "Gadget Reviews",
        description: "최신 테크 기기들의 장단점을 솔직하게 리뷰합니다.",
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=600",
        href: "/category/gadget",
        gradient: "from-violet-500 to-purple-500",
        icon: "📱",
    },
    {
        title: "Gaming Zone",
        description: "콘솔, 모바일, PC 게임의 최신 소식과 심층 리뷰.",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600",
        href: "/category/games",
        gradient: "from-red-500 to-orange-500",
        icon: "🎮",
    },
    {
        title: "Software Tips",
        description: "생산성을 200% 올려주는 필수 소프트웨어 가이드.",
        image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=600",
        href: "/category/software",
        gradient: "from-emerald-500 to-teal-500",
        icon: "⚙️",
    },
];

export const TopicCarousel = () => {
    return (
        <section className="py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-4">
                        주요 토픽
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-lg mb-2">
                        관심 있는 분야를 선택하세요
                    </p>
                    {/* Mobile Scroll Hint */}
                    <p className="md:hidden text-sm text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
                        <span>←</span>
                        <span>좌우로 스크롤하세요</span>
                        <span>→</span>
                    </p>
                </div>

                {/* Carousel Container with Fade Effect */}
                <div className="relative">
                    {/* Right Fade Gradient for Mobile - Subtle */}
                    <div className="md:hidden absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white/50 dark:from-slate-950 dark:via-slate-950/50 to-transparent pointer-events-none z-10" />

                    {/* Carousel */}
                    <Carousel
                        plugins={[
                            Autoplay({
                                delay: 3000,
                                stopOnInteraction: true,
                            }),
                        ]}
                        opts={{
                            align: "center",
                            loop: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-2 md:-ml-4">
                            {topics.map((topic, index) => (
                                <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3 basis-[90%]">
                                    <Link href={topic.href}>
                                        <Card className="group overflow-hidden rounded-[2rem] border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white dark:bg-slate-800">
                                            {/* Image with Gradient Overlay */}
                                            <div className="relative h-48 overflow-hidden">
                                                <div className={`absolute inset-0 bg-gradient-to-br ${topic.gradient} opacity-30 group-hover:opacity-50 transition-opacity duration-500`} />
                                                <img
                                                    src={topic.image}
                                                    alt={topic.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                {/* Icon Badge - Removed as per request */}
                                                {/* <div className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                    {topic.icon}
                                                </div> */}
                                            </div>
                                            {/* Content */}
                                            <CardContent className="p-6 bg-white dark:bg-slate-800">
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                                                    {topic.title}
                                                </h3>
                                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                                    {topic.description}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="hidden md:flex -left-4 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:scale-110 transition-all dark:text-white" />
                        <CarouselNext className="hidden md:flex -right-4 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:scale-110 transition-all dark:text-white" />
                    </Carousel>
                </div>
            </div>
        </section>
    );
};
