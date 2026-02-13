
/**
 * Simple Markdown to HTML converter.
 * Used as a fallback when AI returns Markdown instead of HTML.
 */
export function convertMarkdownToHtml(text: string): string {
    let html = text;

    // 1. Headers (### -> <h3>, ## -> <h2>, # -> <h1>)
    // Handle leading whitespace and ensuring proper closing tags
    // Iterating from h6 down to h1 to avoid partial matches if logic was different, but regex handles it.
    html = html.replace(/^\s*######\s+(.*$)/gim, '<h6>$1</h6>');
    html = html.replace(/^\s*#####\s+(.*$)/gim, '<h5>$1</h5>');
    html = html.replace(/^\s*####\s+(.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^\s*###\s+(.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^\s*##\s+(.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^\s*#\s+(.*$)/gim, '<h1>$1</h1>');

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
    // Check for Markdown headers
    if (/^#{1,3} /m.test(content) || /\*\*.+\*\*/.test(content)) {
        console.log("[Auto-Fix] Markdown detected. Converting to HTML...");
        return convertMarkdownToHtml(content);
    }
    return content;
}
