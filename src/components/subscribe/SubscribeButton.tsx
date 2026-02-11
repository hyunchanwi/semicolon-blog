"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Bell, BellRing, Loader2, CheckCircle, Mail, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

export function SubscribeButton() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [showDialog, setShowDialog] = useState(false);
    const [email, setEmail] = useState("");
    const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleClick = () => {
        if (!session) {
            // 비로그인 → 로그인 필요 안내 다이얼로그
            setShowDialog(true);
            return;
        }
        // 로그인 상태 → 구독 다이얼로그
        setEmail(session.user?.email || "");
        setShowDialog(true);
    };

    const handleSubscribe = async () => {
        if (!email) return;
        setSubmitStatus("loading");

        try {
            const res = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (data.success) {
                setSubmitStatus("success");
                setMessage(data.message);
            } else {
                setSubmitStatus("error");
                setMessage(data.message);
            }
        } catch {
            setSubmitStatus("error");
            setMessage("네트워크 오류가 발생했습니다.");
        }
    };

    const handleLoginRedirect = () => {
        setShowDialog(false);
        router.push("/login");
    };

    if (status === "loading") {
        return null;
    }

    return (
        <>
            <Button
                onClick={handleClick}
                variant="ghost"
                size="sm"
                className="rounded-full px-4 text-slate-600 dark:text-slate-300 font-medium hover:text-primary hover:bg-primary/10 transition-all duration-300 transform hover:-translate-y-0.5 gap-1.5"
            >
                <Bell className="h-4 w-4" />
                <span className="hidden lg:inline">구독</span>
            </Button>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-0">
                    {!session ? (
                        /* 비로그인 상태 */
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                <Lock className="w-8 h-8 text-blue-500" />
                            </div>
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold">로그인이 필요합니다</DialogTitle>
                                <DialogDescription className="mt-2 text-muted-foreground">
                                    구독을 하시려면 먼저 로그인해주세요.<br />
                                    Google 계정으로 간편하게 시작할 수 있어요!
                                </DialogDescription>
                            </DialogHeader>
                            <div className="mt-6 space-y-3">
                                <Button
                                    onClick={handleLoginRedirect}
                                    className="w-full rounded-xl h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold shadow-lg"
                                >
                                    로그인하러 가기
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowDialog(false)}
                                    className="w-full rounded-xl h-10 text-muted-foreground"
                                >
                                    나중에 할게요
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* 로그인 상태 - 구독 플랜 선택 */
                        <div>
                            {/* 헤더 */}
                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 text-white text-center">
                                <BellRing className="w-8 h-8 mx-auto mb-2" />
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold text-white">구독하기</DialogTitle>
                                    <DialogDescription className="text-blue-100 mt-1">
                                        새 글 알림을 받아보세요
                                    </DialogDescription>
                                </DialogHeader>
                            </div>

                            <div className="p-6 space-y-4">
                                {submitStatus === "success" ? (
                                    <div className="text-center py-4">
                                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                                        <p className="font-semibold text-lg">구독 신청 완료!</p>
                                        <p className="text-muted-foreground text-sm mt-1">{message}</p>
                                        <Button
                                            onClick={() => { setShowDialog(false); setSubmitStatus("idle"); }}
                                            className="mt-4 rounded-xl"
                                        >
                                            확인
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        {/* 무료 구독 */}
                                        <div className="border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-4 relative">
                                            <div className="absolute -top-3 left-4 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                                무료
                                            </div>
                                            <div className="mt-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Mail className="w-5 h-5 text-blue-500" />
                                                    <h3 className="font-bold text-base">이메일 알림</h3>
                                                </div>
                                                <ul className="text-sm text-muted-foreground space-y-1.5 mb-4">
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                                        새 글 발행 시 이메일 알림
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                                        주요 업데이트 소식
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                                        언제든 구독 해지 가능
                                                    </li>
                                                </ul>

                                                <div className="flex gap-2">
                                                    <input
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        placeholder="이메일 주소"
                                                        className="flex-1 border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-background"
                                                    />
                                                    <Button
                                                        onClick={handleSubscribe}
                                                        disabled={submitStatus === "loading" || !email}
                                                        className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-5"
                                                    >
                                                        {submitStatus === "loading" ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            "구독"
                                                        )}
                                                    </Button>
                                                </div>

                                                {submitStatus === "error" && (
                                                    <p className="text-red-500 text-xs mt-2">{message}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* 프리미엄 구독 (출시 예정) */}
                                        <div className="border-2 border-dashed border-amber-200 dark:border-amber-800 rounded-2xl p-4 relative opacity-75">
                                            <div className="absolute -top-3 left-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                                <Crown className="w-3 h-3" />
                                                프리미엄
                                            </div>
                                            <div className="absolute -top-3 right-4 bg-slate-700 text-white text-xs font-bold px-3 py-1 rounded-full">
                                                출시 예정
                                            </div>
                                            <div className="mt-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Crown className="w-5 h-5 text-amber-500" />
                                                        <h3 className="font-bold text-base">프리미엄 구독</h3>
                                                    </div>
                                                    <span className="text-lg font-bold text-amber-600">
                                                        ₩1,900<span className="text-xs text-muted-foreground font-normal">/월</span>
                                                    </span>
                                                </div>
                                                <ul className="text-sm text-muted-foreground space-y-1.5">
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                                        무료 구독 혜택 전부 포함
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                                        광고 제거
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                                        신규 글 선행 공개
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                                        전용 프리미엄 콘텐츠
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                                        1:1 질문 & 상담
                                                    </li>
                                                </ul>
                                                <Button
                                                    disabled
                                                    className="w-full mt-4 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 cursor-not-allowed"
                                                    variant="ghost"
                                                >
                                                    🚀 곧 출시됩니다
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
