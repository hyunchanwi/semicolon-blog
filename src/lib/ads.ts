
/**
 * HTML 본문 내용을 특정 위치(예: 두 번째 문단 뒤)에서 분할하는 클래스
 */
export function splitContentForAds(content: string) {
    // </p> 태그를 기준으로 분할 (문단 단위)
    const paragraphs = content.split('</p>');

    if (paragraphs.length <= 3) {
        // 문단이 너무 적으면 그냥 통째로 반환
        return { firstHalf: content, secondHalf: "" };
    }

    // 대략 중간 지점 또는 특정 문단(예: 2~3번째 문단) 뒤에서 자름
    const splitIndex = Math.min(3, Math.floor(paragraphs.length / 2));

    const firstHalf = paragraphs.slice(0, splitIndex).join('</p>') + '</p>';
    const secondHalf = paragraphs.slice(splitIndex).join('</p>');

    return { firstHalf, secondHalf };
}
