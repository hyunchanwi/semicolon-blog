import Link from "next/link";

export const Footer = () => {
    return (
        <footer className="bg-slate-900 text-white mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand */}
                    <div>
                        <h3 className="text-2xl font-bold mb-4">Semicolon;</h3>
                        <p className="text-slate-400 leading-relaxed">
                            기술의 미래를 읽다.<br />
                            AI, 가젯, 소프트웨어의 최신 트렌드를<br />
                            가장 쉽고 깊이 있게 전달합니다.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4 text-slate-300">카테고리</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/category/ai" className="text-slate-400 hover:text-white transition-colors">
                                    AI
                                </Link>
                            </li>
                            <li>
                                <Link href="/category/gadget" className="text-slate-400 hover:text-white transition-colors">
                                    가젯
                                </Link>
                            </li>
                            <li>
                                <Link href="/category/software" className="text-slate-400 hover:text-white transition-colors">
                                    소프트웨어
                                </Link>
                            </li>
                            <li>
                                <Link href="/category/apps" className="text-slate-400 hover:text-white transition-colors">
                                    앱
                                </Link>
                            </li>
                            <li>
                                <Link href="/category/tech" className="text-slate-400 hover:text-white transition-colors">
                                    테크
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4 text-slate-300">문의</h4>
                        <p className="text-slate-400">
                            contactsemicolonblog@gmail.com
                        </p>
                    </div>
                </div>

                <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-slate-500">© 2026 Semicolon;. All rights reserved.</p>
                    <div className="flex gap-6 text-sm">
                        <Link href="/privacy" className="text-slate-500 hover:text-white transition-colors">
                            개인정보처리방침
                        </Link>
                        <Link href="/terms" className="text-slate-500 hover:text-white transition-colors">
                            이용약관
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
