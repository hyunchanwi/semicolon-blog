"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

/**
 * 구독 결과 토스트 알림
 * URL 파라미터에 subscribe=success/error가 있으면 표시
 */
export function SubscribeToast() {
    const [show, setShow] = useState(false);
    const [type, setType] = useState<"success" | "error" | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const subscribeStatus = params.get("subscribe");

        if (subscribeStatus === "success") {
            setType("success");
            setShow(true);
            // URL에서 파라미터 제거
            window.history.replaceState({}, "", window.location.pathname);
        } else if (subscribeStatus === "error") {
            setType("error");
            setShow(true);
            window.history.replaceState({}, "", window.location.pathname);
        }
    }, []);

    // 5초 후 자동 숨김
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => setShow(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [show]);

    if (!show || !type) return null;

    return (
        <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-right">
            <div
                className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl ${type === "success"
                        ? "bg-emerald-600 text-white"
                        : "bg-red-600 text-white"
                    }`}
            >
                {type === "success" ? (
                    <CheckCircle className="w-5 h-5" />
                ) : (
                    <XCircle className="w-5 h-5" />
                )}
                <p className="text-sm font-medium">
                    {type === "success"
                        ? "🎉 구독 인증이 완료되었습니다!"
                        : "인증에 실패했습니다. 다시 시도해주세요."}
                </p>
                <button
                    onClick={() => setShow(false)}
                    className="ml-2 opacity-70 hover:opacity-100"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
