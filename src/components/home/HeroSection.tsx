import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const HeroSection = () => {
    return (
        <section className="relative min-h-[80vh] flex items-center overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30 dark:from-slate-950 dark:via-blue-950/20 dark:to-violet-950/20" />

            {/* Floating Decorative Shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Blob 1 */}
                <div
                    className="absolute -top-20 -left-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-float"
                />
                {/* Blob 2 */}
                <div
                    className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-violet-400/20 rounded-full blur-3xl animate-float-slow"
                />
                {/* Blob 3 */}
                <div
                    className="absolute top-1/2 left-1/3 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl animate-float-delay"
                />

                {/* Decorative Shapes */}
                <div className="absolute top-20 right-20 w-16 h-16 border-2 border-blue-300/30 rounded-2xl rotate-12 animate-float" />
                <div className="absolute bottom-40 left-20 w-12 h-12 bg-violet-300/20 rounded-xl rotate-45 animate-float-slow" />
                <div className="absolute top-1/3 right-1/4 w-8 h-8 bg-cyan-300/30 rounded-full animate-float-delay" />
            </div>

            {/* Content */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left: Text */}
                    <div className="space-y-8">
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
                            <span className="text-slate-900 dark:text-white">기술의 미래를</span>
                            <br />
                            <span className="gradient-text">읽다, Semicolon;</span>
                        </h1>
                        <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
                            AI, 가젯, 소프트웨어의 최신 트렌드를
                            <br />
                            가장 쉽고 깊이 있게 전달합니다.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Button
                                asChild
                                size="lg"
                                className="rounded-full px-8 py-6 text-lg bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 shadow-lg shadow-blue-500/25"
                            >
                                <Link href="/blog">
                                    최신 글 보기 <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                size="lg"
                                className="rounded-full px-8 py-6 text-lg border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-white"
                            >
                                <Link href="/category/ai">
                                    AI 탐험하기
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Right: Image */}
                    <div className="relative hidden lg:block">
                        <div className="relative w-full aspect-square max-w-lg mx-auto">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-[3rem] rotate-6" />
                            <div className="absolute inset-0 glass rounded-[3rem] shadow-glass overflow-hidden">
                                <Image
                                    src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000"
                                    alt="Technology"
                                    fill
                                    priority
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
