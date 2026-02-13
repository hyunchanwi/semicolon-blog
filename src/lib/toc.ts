/**
 * TOC (Table of Contents) 유틸리티
 * HTML 콘텐츠에서 헤딩 태그를 추출하고 목차 데이터를 생성
 * cheerio 의존성 없이 순수 정규식 기반으로 처리
 */

export interface TocItem {
    id: string;
    text: string;
    level: number; // 2, 3, 4
}

/**
 * HTML 태그 내 텍스트를 추출하고 엔티티를 디코딩합니다.
 */
/**
 * HTML 태그 내 텍스트를 추출하고 엔티티를 디코딩합니다.
 */
function stripHtmlTags(html: string): string {
    // 1. 태그 제거
    let text = html.replace(/<[^>]*>/g, '');

    // 2. 주요 HTML 엔티티 처리 (Expanded)
    text = text
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#8211;/g, "–") // En Dash
        .replace(/&#8212;/g, "—") // Em Dash
        .replace(/&#8216;/g, "'") // Left Single Quote
        .replace(/&#8217;/g, "'") // Right Single Quote
        .replace(/&#8220;/g, '"') // Left Double Quote
        .replace(/&#8221;/g, '"') // Right Double Quote
        .replace(/&#8230;/g, "..."); // Ellipsis

    return text.trim();
}

/**
 * 텍스트에서 고유 ID를 생성합니다 (한글 지원).
 */
function generateId(text: string, idCounts: Record<string, number>): string {
    let baseId = text
        .toLowerCase()
        // 한글(완성형, 자모), 영문, 숫자, 공백, 하이픈 허용
        .replace(/[^\w\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    if (!baseId) baseId = 'section';

    if (idCounts[baseId]) {
        idCounts[baseId]++;
        baseId = `${baseId}-${idCounts[baseId]}`;
    } else {
        idCounts[baseId] = 1;
    }

    return `toc-${baseId}`;
}

/**
 * HTML 콘텐츠를 파싱하여 목차 데이터를 추출하고,
 * 각 헤딩에 고유 ID를 주입한 수정된 HTML을 반환합니다.
 * 지원 태그: h1, h2, h3, h4
 */
export function processContentForTOC(html: string): {
    content: string;
    toc: TocItem[];
} {
    const toc: TocItem[] = [];
    const idCounts: Record<string, number> = {};

    // h1, h2, h3, h4 태그 매칭 (속성 포함)
    // h1은 주로 제목이지만 본문에 쓰인 경우도 포함 (level 2로 취급하거나 별도 처리)
    const headingRegex = /<(h[1234])([^>]*)>([\s\S]*?)<\/\1>/gi;

    const content = html.replace(headingRegex, (match, tag, attrs, innerHtml) => {
        const text = stripHtmlTags(innerHtml);
        if (!text) return match;

        const tagName = tag.toLowerCase();
        let level = 2;
        if (tagName === 'h3') level = 3;
        if (tagName === 'h4') level = 4;
        // h1도 level 2로 처리 (TOC 최상위)

        const id = generateId(text, idCounts);

        toc.push({ id, text, level });

        // 기존 id 속성이 있으면 교체, 없으면 추가
        if (/id\s*=\s*["']/.test(attrs)) {
            attrs = attrs.replace(/id\s*=\s*["'][^"']*["']/, `id="${id}"`);
        } else {
            attrs = ` id="${id}"${attrs}`;
        }

        return `<${tag}${attrs}>${innerHtml}</${tag}>`;
    });

    return { content, toc };
}
