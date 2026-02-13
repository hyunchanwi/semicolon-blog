
/**
 * Simple Markdown to HTML converter.
 * Used as a fallback when AI returns Markdown instead of HTML.
 */
export function convertMarkdownToHtml(text: string): string {
    let html = text;

    // 1. Headers (### -> <h3>, ## -> <h2>, # -> <h1>)
    // Simplify: Match hash sequence at start of line (handling potential whitespace)
    // We use a robust pattern that matches newline or start of string explicitly.
    // Note: The replacement needs to ensure we don't eat valid text.

    const headers = [
        { regex: /(?:^|\r?\n)\s{0,3}#{6}\s+(.+?)(?:\s+#+)?(?=\r?\n|$)/g, tag: 'h6' },
        { regex: /(?:^|\r?\n)\s{0,3}#{5}\s+(.+?)(?:\s+#+)?(?=\r?\n|$)/g, tag: 'h5' },
        { regex: /(?:^|\r?\n)\s{0,3}#{4}\s+(.+?)(?:\s+#+)?(?=\r?\n|$)/g, tag: 'h4' },
        { regex: /(?:^|\r?\n)\s{0,3}#{3}\s+(.+?)(?:\s+#+)?(?=\r?\n|$)/g, tag: 'h3' },
        { regex: /(?:^|\r?\n)\s{0,3}#{2}\s+(.+?)(?:\s+#+)?(?=\r?\n|$)/g, tag: 'h2' },
        { regex: /(?:^|\r?\n)\s{0,3}#{1}\s+(.+?)(?:\s+#+)?(?=\r?\n|$)/g, tag: 'h1' },
    ];

    for (const h of headers) {
        // Use a function replacer to handle the leading newline correctly
        html = html.replace(h.regex, (match, content, offset) => {
            // If match started with newline, keep it? 
            // Actually, usually we want to replace the whole line.
            // But let's just output the tag.
            return `\n<${h.tag}>${content}</${h.tag}>`;
        });
    }

    // 2. Bold (**text**)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 3. Lists
    // Unordered lists (- item or * item) -> Wrap in <li>
    // Note: This does NOT wrap them in <ul>. Complex list parsing requires a parser.
    // For now, we rely on the browser's loose parsing or WP's autop.
    html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');

    // 4. Blockquotes (> text)
    html = html.replace(/^\s*>\s+(.*$)/gim, '<blockquote>$1</blockquote>');

    // 5. Horizontal Rule
    html = html.replace(/^\s*---\s*$/gim, '<hr />');

    return html;
}

/**
 * Ensures the content is HTML.
 * If it detects Markdown headers, it applies conversion.
 */
export function ensureHtml(content: string): string {
    // Check for ANY Markdown headers (1-6 hashes)
    // Use a simpler check: if line starts with # and space, or just #.
    if (/(?:^|\n)\s*#{1,6}\s+/.test(content) || /\*\*.+\*\*/.test(content)) {
        console.log("[Auto-Fix] Markdown detected. Converting to HTML...");
        return convertMarkdownToHtml(content);
    }
    return content;
}
