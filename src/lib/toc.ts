/**
 * TOC (Table of Contents) 유틸리티
 * HTML 콘텐츠에서 헤딩 태그를 추출하고 목차 데이터를 생성
 */

import * as cheerio from 'cheerio';

export interface TocItem {
    id: string;
    text: string;
    level: number; // 2 or 3
}

/**
 * HTML 콘텐츠를 파싱하여 목차 데이터를 추출하고,
 * 각 헤딩에 고유 ID를 주입한 수정된 HTML을 반환합니다.
 */
export function processContentForTOC(html: string): {
    content: string;
    toc: TocItem[];
} {
    const $ = cheerio.load(html, { decodeEntities: false });
    const toc: TocItem[] = [];
    const idCounts: Record<string, number> = {};

    $('h2, h3').each((_, element) => {
        const $el = $(element);
        const text = $el.text().trim();
        if (!text) return;

        const tagName = element.type === 'tag' ? element.tagName : '';
        const level = tagName === 'h2' ? 2 : 3;

        // 고유 ID 생성 (한글 지원)
        let baseId = text
            .toLowerCase()
            .replace(/[^\w\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\s-]/g, '') // 한글 + 영어 + 숫자 + 공백 + 하이픈
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        if (!baseId) baseId = `section`;

        // 중복 ID 처리
        if (idCounts[baseId]) {
            idCounts[baseId]++;
            baseId = `${baseId}-${idCounts[baseId]}`;
        } else {
            idCounts[baseId] = 1;
        }

        const id = `toc-${baseId}`;

        // 헤딩에 ID 주입
        $el.attr('id', id);

        toc.push({ id, text, level });
    });

    return {
        content: $.html() || html,
        toc,
    };
}
