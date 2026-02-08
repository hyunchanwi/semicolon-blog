import { Metadata } from "next";

export const metadata: Metadata = {
    title: "이용약관 | Semicolon;",
    description: "Semicolon; 블로그의 이용약관입니다.",
};

export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">
                이용약관
            </h1>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                <p className="text-slate-600 dark:text-slate-400">
                    <strong>시행일: 2026년 1월 28일</strong>
                </p>

                <section>
                    <h2>제1조 (목적)</h2>
                    <p>
                        이 약관은 Semicolon;(이하 "회사")이 제공하는 인터넷 서비스(이하 "서비스")의
                        이용조건 및 절차, 회사와 이용자의 권리, 의무, 책임사항과 기타 필요한 사항을
                        규정함을 목적으로 합니다.
                    </p>
                </section>

                <section>
                    <h2>제2조 (용어의 정의)</h2>
                    <ul>
                        <li><strong>"서비스"</strong>란 회사가 운영하는 웹사이트 및 관련 서비스를 말합니다.</li>
                        <li><strong>"이용자"</strong>란 이 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
                        <li><strong>"회원"</strong>이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</li>
                    </ul>
                </section>

                <section>
                    <h2>제3조 (약관의 효력 및 변경)</h2>
                    <ol>
                        <li>이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
                        <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 이 약관을 변경할 수 있습니다.</li>
                        <li>변경된 약관은 공지와 동시에 그 효력이 발생합니다.</li>
                    </ol>
                </section>

                <section>
                    <h2>제4조 (서비스의 제공)</h2>
                    <p>회사는 다음과 같은 서비스를 제공합니다:</p>
                    <ul>
                        <li>기술 관련 블로그 콘텐츠 제공</li>
                        <li>뉴스레터 및 정보 제공 서비스</li>
                        <li>회원 맞춤형 콘텐츠 추천</li>
                        <li>기타 회사가 정하는 서비스</li>
                    </ul>
                </section>

                <section>
                    <h2>제5조 (이용자의 의무)</h2>
                    <p>이용자는 다음 행위를 하여서는 안 됩니다:</p>
                    <ul>
                        <li>타인의 정보 도용</li>
                        <li>회사가 게시한 정보의 무단 변경</li>
                        <li>회사가 허용한 정보 이외의 정보 송신 또는 게시</li>
                        <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                        <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                        <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
                    </ul>
                </section>

                <section>
                    <h2>제6조 (광고 게재)</h2>
                    <p>
                        회사는 서비스 운영과 관련하여 서비스 화면, 이메일 등에 광고를 게재할 수 있습니다.
                        광고가 게재된 이메일을 수신한 회원은 수신거절을 할 수 있습니다.
                    </p>
                    <p>
                        본 서비스는 Google AdSense 및 쿠팡 파트너스 등 제휴 마케팅 프로그램에 참여하고 있으며,
                        이를 통해 수익을 창출할 수 있습니다.
                    </p>
                </section>

                <section>
                    <h2>제7조 (저작권의 귀속)</h2>
                    <ol>
                        <li>서비스에 게시된 콘텐츠의 저작권은 회사에 귀속됩니다.</li>
                        <li>이용자는 서비스를 이용함으로써 얻은 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 등 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.</li>
                    </ol>
                </section>

                <section>
                    <h2>제8조 (면책조항)</h2>
                    <ol>
                        <li>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
                        <li>회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.</li>
                        <li>회사는 이용자가 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않습니다.</li>
                    </ol>
                </section>

                <section>
                    <h2>제9조 (분쟁해결)</h2>
                    <p>
                        회사와 이용자 간에 발생한 서비스 이용에 관한 분쟁에 대하여는 대한민국 법을 적용하며,
                        본 분쟁으로 인한 소는 민사소송법상의 관할법원에 제기합니다.
                    </p>
                </section>

                <section>
                    <h2>부칙</h2>
                    <p>이 약관은 2026년 1월 28일부터 시행합니다.</p>
                </section>
            </div>
        </div>
    );
}
