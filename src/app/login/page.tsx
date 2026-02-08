"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30 p-4">
            <Card className="w-full max-w-md rounded-[2rem] shadow-xl border-0">
                <CardHeader className="text-center pb-2">
                    <Link href="/" className="text-3xl font-bold text-slate-900 mb-2 inline-block">
                        Semicolon;
                    </Link>
                    <CardTitle className="text-xl">로그인</CardTitle>
                    <CardDescription>
                        소셜 계정으로 간편하게 로그인하세요
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Google Login */}
                    <Button
                        variant="outline"
                        className="w-full h-12 rounded-xl text-base font-medium"
                        onClick={() => signIn("google", { callbackUrl: "/" })}
                    >
                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Google로 로그인
                    </Button>

                    {/* Kakao Login */}
                    <Button
                        className="w-full h-12 rounded-xl text-base font-medium bg-[#FEE500] hover:bg-[#F5DC00] text-black"
                        onClick={() => signIn("kakao", { callbackUrl: "/" })}
                    >
                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                            <path
                                fill="#000000"
                                d="M12 3C6.477 3 2 6.463 2 10.714c0 2.683 1.783 5.04 4.465 6.386-.14.514-.91 3.315-.943 3.537 0 0-.019.159.084.22.103.06.224.014.224.014.296-.04 3.432-2.24 3.975-2.614.724.103 1.474.157 2.195.157 5.523 0 10-3.463 10-7.714S17.523 3 12 3z"
                            />
                        </svg>
                        카카오로 로그인
                    </Button>

                    {/* Naver Login */}
                    <Button
                        className="w-full h-12 rounded-xl text-base font-medium bg-[#03C75A] hover:bg-[#02b351] text-white"
                        onClick={() => signIn("naver", { callbackUrl: "/" })}
                    >
                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"
                            />
                        </svg>
                        네이버로 로그인
                    </Button>

                    <div className="text-center pt-4">
                        <Button
                            asChild
                            variant="ghost"
                            className="text-slate-500 hover:text-slate-700"
                        >
                            <Link href="/">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                홈으로 돌아가기
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
