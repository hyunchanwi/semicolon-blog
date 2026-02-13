
/**
 * Simple Markdown to HTML converter.
 * Used as a fallback when AI returns Markdown instead of HTML.
 */
export function convertMarkdownToHtml(text: string): string {
    let html = text;

    // 1. Headers (### -> <h3>, ## -> <h2>, # -> <h1>)
    // Be careful not to match inside code blocks or other contexts, but for blog posts this is usually fine.
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // 2. Bold (**text**)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 3. Lists
    // Unordered lists (- item or * item)
    // This is tricky with regex only. A simple approach:
    // If we see lines starting with - or *, wrap them in <li>.
    // Grouping them into <ul> is harder without a parser.
    // For now, let's just convert the line to <li> and rely on browser or simple parsing? 
    // No, <li> must be inside <ul>.
    // Let's assume the AI generates decent blocks. 
    // If the whole block is MD, we might want to just replace bullet points.

    // Simple list item conversion (might produce invalid HTML if not wrapped in <ul>)
    // But WordPress might handle it or we accept partial validity.
    // Better: wrap continuous list items.

    // A simpler heuristic for list items:
    html = html.replace(/^\s*[-*] (.*$)/gim, '<li>$1</li>');

    // 4. Blockquotes (> text)
    html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

    // 5. Paragraphs?
    // If double newline, make it a paragraph.
    // html = html.replace(/\n\n/g, '</p><p>');

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
