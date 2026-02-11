"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

function UnsubscribeContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("유효하지 않은 링크입니다.");
            return;
        }

        const unsubscribe = async () => {
            try {
                const res = await fetch(`/api/subscribe?token=${token}`, {
                    method: "DELETE",
                });
                const data = await res.json();

                if (data.success) {
                    setStatus("success");
                    setMessage(data.message);
                } else {
                    setStatus("error");
                    setMessage(data.message);
                }
            } catch {
                setStatus("error");
                setMessage("네트워크 오류가 발생했습니다.");
            }
        };

        unsubscribe();
    }, [token]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                {status === "loading" && (
                    <div className="space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
                        <h1 className="text-xl font-semibold text-foreground">구독 해지 처리 중...</h1>
                    </div>
                )}

                {status === "success" && (
                    <div className="space-y-4">
                        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
                        <h1 className="text-2xl font-bold text-foreground">구독이 해지되었습니다</h1>
                        <p className="text-muted-foreground">{message}</p>
                        <p className="text-sm text-muted-foreground">
                            더 이상 이메일 알림을 받지 않습니다.
                        </p>
                        <Link
                            href="/"
                            className="inline-block mt-4 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                        >
                            홈으로 돌아가기
                        </Link>
                    </div>
                )}

                {status === "error" && (
                    <div className="space-y-4">
                        <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                        <h1 className="text-2xl font-bold text-foreground">오류 발생</h1>
                        <p className="text-muted-foreground">{message}</p>
                        <Link
                            href="/"
                            className="inline-block mt-4 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                        >
                            홈으로 돌아가기
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function UnsubscribePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        }>
            <UnsubscribeContent />
        </Suspense>
    );
}
