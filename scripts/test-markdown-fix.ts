
import { ensureHtml } from "../src/lib/markdown-to-html";

const sampleIssue = `#### Phase 1: 리서치 및 설정 (AIO 키워드 타겟팅)

AIO의 시작은 AI가 어떤 질문에 내 답변을 활용할지 예측하는 것입니다.

1. AI 모델에게 여러분의 분야와 관련된 질문을 던져보세요.
2. AI가 답변을 생성할 때 어떤 정보를 누락하는지 확인하세요.`;

console.log("--- Original ---");
console.log(sampleIssue);
console.log("\n--- Converted ---");
const converted = ensureHtml(sampleIssue);
console.log(converted);

if (converted.includes("<h4>Phase 1:")) {
    console.log("\n✅ SUCCESS: '####' converted to <h4>");
} else {
    console.log("\n❌ FAILED: '####' NOT converted");
}
