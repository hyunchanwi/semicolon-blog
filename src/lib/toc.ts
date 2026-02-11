/**
 * TOC (Table of Contents) 유틸리티
 * HTML 콘텐츠에서 헤딩 태그를 추출하고 목차 데이터를 생성
 * cheerio 의존성 없이 순수 정규식 기반으로 처리
 */

export interface TocItem {
    id: string;
    text: string;
    level: number; // 2 or 3
}

/**
 * HTML 태그 내 텍스트를 추출합니다.
 */
function stripHtmlTags(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * 텍스트에서 고유 ID를 생성합니다 (한글 지원).
 */
function generateId(text: string, idCounts: Record<string, number>): string {
    let baseId = text
        .toLowerCase()
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
 */
export function processContentForTOC(html: string): {
    content: string;
    toc: TocItem[];
} {
    const toc: TocItem[] = [];
    const idCounts: Record<string, number> = {};

    // h2, h3 태그 매칭 (속성 포함)
    const headingRegex = /<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi;

    const content = html.replace(headingRegex, (match, tag, attrs, innerHtml) => {
        const text = stripHtmlTags(innerHtml);
        if (!text) return match;

        const level = tag.toLowerCase() === 'h2' ? 2 : 3;
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
