"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

// Filter out undefined/null and ensure string type
const ADMIN_EMAILS = [
    process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    "hyunchan09@gmail.com",
    "wihyunchan@naver.com",
    "contactsemicolonblog@gmail.com"
].filter((email): email is string => !!email);

export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") return;

        if (!session) {
            router.push("/login");
            return;
        }

        if (!session.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
            router.push("/");
            return;
        }
    }, [session, status, router]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!session || !session.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">접근 권한 없음</h1>
                    <p className="text-slate-600">관리자만 접근할 수 있습니다.</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
