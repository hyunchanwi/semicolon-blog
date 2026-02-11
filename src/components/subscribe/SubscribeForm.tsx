"use client";

import { useState } from "react";
import { Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export function SubscribeForm({ compact = false }: { compact?: boolean }) {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus("loading");

        try {
            const res = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (data.success) {
                setStatus("success");
                setMessage(data.message);
                setEmail("");
            } else {
                setStatus("error");
                setMessage(data.message);
            }
        } catch {
            setStatus("error");
            setMessage("네트워크 오류가 발생했습니다.");
        }
    };

    // 콤팩트 버전 (푸터용)
    if (compact) {
        return (
            <div>
                <h4 className="text-lg font-semibold mb-3 text-slate-300">뉴스레터</h4>
                {status === "success" ? (
                    <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">{message}</span>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-2">
                        <p className="text-slate-400 text-sm mb-3">새 글 알림을 받아보세요</p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="이메일 주소"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                required
                                disabled={status === "loading"}
                            />
                            <button
                                type="submit"
                                disabled={status === "loading"}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                                {status === "loading" ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "구독"
                                )}
                            </button>
                        </div>
                        {status === "error" && (
                            <p className="text-red-400 text-xs">{message}</p>
                        )}
                    </form>
                )}
            </div>
        );
    }

    // 풀 버전 (배너용)
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 p-8 text-white">
            {/* 배경 장식 */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/15 rounded-xl">
                        <Mail className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold">새 글 알림 받기</h3>
                </div>

                <p className="text-blue-100 mb-6 leading-relaxed">
                    AI, 가젯, 소프트웨어의 최신 트렌드를<br className="hidden sm:block" />
                    이메일로 가장 먼저 만나보세요. 무료입니다!
                </p>

                {status === "success" ? (
                    <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-xl p-4">
                        <CheckCircle className="w-6 h-6 text-emerald-300 flex-shrink-0" />
                        <p className="text-sm leading-relaxed">{message}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-1 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/40 focus:border-transparent outline-none text-sm"
                                required
                                disabled={status === "loading"}
                            />
                            <button
                                type="submit"
                                disabled={status === "loading"}
                                className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-6 py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm whitespace-nowrap shadow-lg"
                            >
                                {status === "loading" ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Mail className="w-4 h-4" />
                                        무료 구독하기
                                    </>
                                )}
                            </button>
                        </div>
                        {status === "error" && (
                            <div className="flex items-center gap-2 text-red-200 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                {message}
                            </div>
                        )}
                        <p className="text-white/50 text-xs">
                            스팸 없이 새 글 알림만 보내드려요. 언제든 구독 해지 가능합니다.
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
