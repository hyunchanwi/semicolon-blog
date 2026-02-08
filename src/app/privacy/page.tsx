import { Metadata } from "next";

export const metadata: Metadata = {
    title: "개인정보처리방침 | Semicolon;",
    description: "Semicolon; 블로그의 개인정보처리방침입니다.",
};

export default function PrivacyPolicyPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">
                개인정보처리방침
            </h1>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                <p className="text-slate-600 dark:text-slate-400">
                    <strong>시행일: 2026년 1월 28일</strong>
                </p>

                <section>
                    <h2>1. 개인정보의 처리 목적</h2>
                    <p>
                        Semicolon;(이하 "회사")은 다음의 목적을 위하여 개인정보를 처리합니다.
                        처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며,
                        이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
                    </p>
                    <ul>
                        <li>회원 가입 및 관리: 회원제 서비스 이용에 따른 본인확인, 회원자격 유지·관리</li>
                        <li>서비스 제공: 콘텐츠 제공, 맞춤형 서비스 제공</li>
                        <li>마케팅 및 광고: 신규 서비스 안내, 이벤트 정보 제공</li>
                    </ul>
                </section>

                <section>
                    <h2>2. 수집하는 개인정보 항목</h2>
                    <p>회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:</p>
                    <ul>
                        <li><strong>필수항목:</strong> 이메일 주소, 이름 (소셜 로그인 시)</li>
                        <li><strong>자동수집항목:</strong> 접속 IP, 쿠키, 접속 로그, 서비스 이용기록</li>
                    </ul>
                </section>

                <section>
                    <h2>3. 개인정보의 보유 및 이용기간</h2>
                    <p>
                        회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에
                        동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
                    </p>
                    <ul>
                        <li>회원 정보: 회원 탈퇴 시까지</li>
                        <li>서비스 이용 기록: 3년</li>
                    </ul>
                </section>

                <section>
                    <h2>4. 개인정보의 제3자 제공</h2>
                    <p>
                        회사는 원칙적으로 정보주체의 개인정보를 제1조에서 명시한 목적 범위 내에서 처리하며,
                        정보주체의 사전 동의 없이는 본래의 범위를 초과하여 처리하거나 제3자에게 제공하지 않습니다.
                    </p>
                </section>

                <section>
                    <h2>5. 쿠키(Cookie)의 사용</h2>
                    <p>
                        회사는 개인화되고 맞춤화된 서비스를 제공하기 위해서 이용자의 정보를 저장하고
                        수시로 불러오는 '쿠키(cookie)'를 사용합니다.
                    </p>
                    <p>
                        <strong>광고 관련:</strong> 본 사이트는 Google AdSense를 통해 광고를 게재하며,
                        Google은 사용자의 관심사에 맞는 광고를 게재하기 위해 쿠키를 사용할 수 있습니다.
                    </p>
                </section>

                <section>
                    <h2>6. 정보주체의 권리·의무</h2>
                    <p>이용자는 다음과 같은 권리를 행사할 수 있습니다:</p>
                    <ul>
                        <li>개인정보 열람 요구</li>
                        <li>오류 등이 있을 경우 정정 요구</li>
                        <li>삭제 요구</li>
                        <li>처리정지 요구</li>
                    </ul>
                </section>

                <section>
                    <h2>7. 개인정보 보호책임자</h2>
                    <p>
                        회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고,
                        개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여
                        아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                    </p>
                    <ul>
                        <li><strong>담당자:</strong> Semicolon; 운영팀</li>
                        <li><strong>이메일:</strong> contactsemicolonblog@gmail.com</li>
                    </ul>
                </section>

                <section>
                    <h2>8. 개인정보처리방침 변경</h2>
                    <p>
                        이 개인정보처리방침은 2026년 1월 28일부터 적용됩니다.
                        이전의 개인정보처리방침은 본 방침으로 대체됩니다.
                    </p>
                </section>
            </div>
        </div>
    );
}
