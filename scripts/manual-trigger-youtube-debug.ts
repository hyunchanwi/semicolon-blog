import { config } from "dotenv";
config({ path: ".env.local" });

import { GoogleGenerativeAI } from "@google/generative-ai";
import { YouTubeVideo } from "../src/lib/youtube-channels";

// --- Mock Video Data ---
const mockVideo: YouTubeVideo = {
    id: "vL7S1R-O2P8", // 예시 영상 ID
    title: "M4 맥미니가 미친 이유, 진짜 역대급 가성비입니다",
    description: `M4 맥미니가 출시되었습니다. 이번 맥미니가 왜 역대급인지, 이전 세대와 무엇이 다른지 상세하게 분석해 드립니다. 
    디자인이 작아졌고, 성능은 압도적으로 좋아졌습니다. 특히 M4 칩셋의 성능은 이전 세대인 M2 Pro를 위협할 정도입니다.
    기본 메모리가 16GB부터 시작한다는 점도 엄청난 장점입니다. 이제 진정한 가성비 데스크탑이 되었습니다.
    포트 구성도 전면에 C타입 2개가 생겨서 훨씬 편리해졌습니다. Apple 실리콘의 정점을 보여주는 제품이라고 할 수 있겠네요.
    하지만 크기가 작아진 만큼 발열 관리는 어떨지, 실제 사용 시 전력 소모는 어느 정도인지도 궁금해하실 텐데요.
    이번 영상에서는 이런 궁금증들을 하나씩 해결해 드리고, 누구에게 이 제품이 가장 적합한지도 추천해 드립니다.`,
    channelName: "잇섭",
    channelId: "UCdUcjkyZtf-1WJyPPiETF1g",
    publishedAt: new Date().toISOString(),
    thumbnailUrl: "https://i.ytimg.com/vi/vL7S1R-O2P8/hqdefault.jpg",
    category: "gadget"
};

async function testGeneration() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `다음 유튜브 영상을 참고하여 IT/테크 블로그 글을 작성해주세요.

## 영상 정보
- 제목: ${mockVideo.title}
- 채널: ${mockVideo.channelName}
- 설명: ${mockVideo.description}

## 작성 원칙 (매우 중요)
1. **분량**: 반드시 **공백 제외 3000자 이상** 작성하세요. 주제에 대해 아주 상세하고 심도 있게 다루어야 합니다. (매우 중요)
2. **어조**: 전문 IT 칼럼니스트 또는 기술 분석가의 어조로 작성하세요. "~합니다", "~이다" 체를 혼용하되 전문성을 유지하세요.
3. **본문 구성 지침**: 
    - **제목**: SEO 최적화된 전문적인 제목.
    - **서론**: 시의성과 기대감 전달.
    - **핵심 요약 (Key Highlights)**: 별도 섹션으로 정리.
    - **심층 분석 및 본문**: 3개 이상의 소제목으로 풍부하게 서술.
    - **결론 및 시사점**: 명확한 결론과 업계 향후 전망 포함.
4. **출력 형식 (JSON Only)**: { "title": "...", "content": "..." }
`;

    console.log("🚀 유튜브 글 생성 테스트 시작...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("JSON not found");
        const parsed = JSON.parse(jsonMatch[0]);

        console.log("✅ 생성 완료!");
        console.log("-----------------------------------------");
        console.log(`📌 제목: ${parsed.title}`);
        console.log(`📊 분량 (HTML 포함): ${parsed.content.length} 자`);
        console.log(`📄 본문 첫 300자: ${parsed.content.substring(0, 300)}...`);
        console.log("-----------------------------------------");

        if (parsed.content.length < 3000) {
            console.warn("⚠️ 경고: 분량이 요청(3000자)보다 적습니다.");
        } else {
            console.log("✨ 분량 조건 충족!");
        }

    } catch (e) {
        console.error("❌ 파싱 실패 또는 오류 발생:", e);
        console.log("응답 내용:", text);
    }
}

testGeneration();
