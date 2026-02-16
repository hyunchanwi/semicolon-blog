
/**
 * Text Similarity & Duplicate Detection Utilities
 * Inspired by Perplexity's suggestion to use Keyword/Entity matching.
 */

// Common Korean Stopwords (Generic)
const STOPWORDS = new Set([
    '이', '그', '저', '것', '수', '등', '를', '을', '은', '는', '이', '가',
    '에', '와', '과', '도', '로', '으로', '자', '위해', '라', '마', '바',
    '최신', '최고', '추천', '리뷰', '사용기', '완벽', '정리', '분석', '가이드',
    '영상', '공개', '출시', '정보', '뉴스', '소식', '기능', '특징', '장단점',
    '가격', '스펙', '성능', '비교', '총정리', '알아보기', '방법', '꿀팁'
]);

/**
 * Extract meaningful tokens from text.
 * Prioritizes:
 * 1. English words (Brands, Product names) - e.g., "NVIDIA", "Galaxy"
 * 2. Alphanumeric codes (Model numbers) - e.g., "S24", "RTX4090", "M3"
 * 3. Korean words (length >= 2) excluding stopwords
 */
export function extractKeywords(text: string): Set<string> {
    const tokens = new Set<string>();

    // Normalize: lowercase
    const normalized = text.toLowerCase();

    const SYNONYMS: Record<string, string> = {
        '아이폰': 'iphone',
        '갤럭시': 'galaxy',
        '애플': 'apple',
        '삼성': 'samsung',
        '엔비디아': 'nvidia',
        '툴': '도구',
        'tool': '도구',
        '방안': '방법',
        '방식': '방법',
        '후기': '리뷰',
        '사용기': '리뷰',
        'review': '리뷰',
        '장점': '특징',
        '단점': '특징'
    };

    // 1. Extract English/Alphanumeric Entities (e.g., "dgx", "spark", "s24", "iphone16")
    // Regex: Matches words starting with alphanumeric, allowing embedded hyphens/dots sometimes?
    // Let's keep it simple: \b[a-z0-9]+\b matches words. 
    // We want to capture "dgx", "spark", "s24 ultra" (split).
    const engMatches = normalized.match(/[a-z0-9]+/g) || [];
    engMatches.forEach(t => {
        if (t.length > 1) {
            // Actually, "2026" is a year, "10" is top 10. 
            // Better to ignore pure numbers unless mixed?
            // "s24" is Mixed. "4090" is pure number but model.
            // Let's keep alphanumeric, but maybe ignore 4-digit years if possible?
            // Allow numbers if they are NOT years (2020-2039)
            if (/^20[2-3][0-9]$/.test(t)) return;

            // Allow pure numbers if NOT year
            // And allow mixed alphanumeric
            tokens.add(t);
        }
    });

    // 2. Extract Korean chunks
    // Remove non-Korean, non-space chars to isolate Korean
    const korText = normalized.replace(/[^가-힣\s]/g, ' ');
    const korTokens = korText.split(/\s+/);

    korTokens.forEach(t => {
        if (t.length >= 2 && !STOPWORDS.has(t)) {
            // Normalize synonyms
            if (SYNONYMS[t]) tokens.add(SYNONYMS[t]);
            else tokens.add(t);
        }
    });

    return tokens;
}

/**
 * Calculate Jaccard Similarity between two sets of tokens.
 * Intersection / Union
 */
export function calculateJaccardSimilarity(text1: string, text2: string): { score: number; intersection: string[] } {
    const set1 = extractKeywords(text1);
    const set2 = extractKeywords(text2);

    if (set1.size === 0 || set2.size === 0) return { score: 0, intersection: [] };

    let intersectionCount = 0;
    const intersectionTokens: string[] = [];

    set1.forEach(t => {
        if (set2.has(t)) {
            intersectionCount++;
            intersectionTokens.push(t);
        }
    });

    const unionCount = new Set([...set1, ...set2]).size;

    return {
        score: intersectionCount / unionCount,
        intersection: intersectionTokens
    };
}

/**
 * Check if two titles are essentially duplicates based on Entity Matching.
 * Rule: 
 * - If they share critical Product Entities (e.g. "DGX", "Spark"), they are likely dups.
 * - If Jaccard Score > threshold.
 */
export function isTitleDuplicate(title1: string, title2: string): { isDuplicate: boolean; score: number; reason: string } {
    const { score, intersection } = calculateJaccardSimilarity(title1, title2);

    // Heuristics derived from user feedback
    // "엔비디아 DGX Spark" -> "dgx", "spark" found in both.

    // Critical Entity Check: If rare/specific entities match, high chance of dup.
    // e.g. "dgx", "spark", "rtx", "iphone"
    // If we have >= 2 specific English tokens matching, it's very strong.
    const engTokens = intersection.filter(t => /^[a-z0-9]+$/.test(t));

    // Logic 1: High Keyword Overlap
    if (score >= 0.4) { // 40% overlap is quite high for distinct titles
        return { isDuplicate: true, score, reason: `Similarity ${Math.round(score * 100)}% (Keywords: ${intersection.join(', ')})` };
    }

    // Logic 2: Product Name Matching (At least 2 unique English/Alphanumeric tokens overlap)
    // e.g. "dgx", "spark" -> 2 tokens. 
    // "galaxy", "s24" -> 2 tokens.
    if (engTokens.length >= 2) {
        // Double check they aren't common words? (already filtered reasonably?)
        return { isDuplicate: true, score, reason: `Product Identity Match (${engTokens.join(', ')})` };
    }

    // Logic 3: Generic Noun Overlap (If no Product ID, but high Jaccard + same "Meaning")
    // e.g. "AI 개발 도구" vs "AI 개발 툴" -> "ai", "개발", "도구" (Normalized) -> 100% match
    // handled by Logic 1 (score 1.0 > 0.4)
    // But if "AI Tools Top 5" vs "Best AI Tools"
    // "ai", "tools", "top", "5" vs "best", "ai", "tools"
    // intersection: "ai", "tools" (2). Union: 5. Score: 0.4. -> Caught by Logic 1.

    // Logic 4: Strict mode for very short generic titles
    // If we only have generic Korean words (no English brands), we might want a higher threshold?
    // Current 0.4 is safe enough, but let's be careful.

    return { isDuplicate: false, score, reason: "" };
}
