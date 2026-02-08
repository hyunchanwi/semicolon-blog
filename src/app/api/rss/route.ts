import { getPosts, stripHtml, getFeaturedImageUrl } from "@/lib/wp-api";

export async function GET() {
    const posts = await getPosts(20);

    const baseUrl = "https://semicolonittech.com";

    // HTML 엔티티 디코딩 함수
    const decodeHtmlEntities = (text: string): string => {
        return text
            .replace(/&#8216;/g, "'")
            .replace(/&#8217;/g, "'")
            .replace(/&#8220;/g, '"')
            .replace(/&#8221;/g, '"')
            .replace(/&#8211;/g, "–")
            .replace(/&#8212;/g, "—")
            .replace(/&#038;/g, "&")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"');
    };

    const items = posts.map(post => {
        const title = decodeHtmlEntities(stripHtml(post.title.rendered));
        const description = decodeHtmlEntities(stripHtml(post.excerpt.rendered));
        const link = `${baseUrl}/blog/${post.slug}`;
        const pubDate = new Date(post.date).toUTCString();
        const imageUrl = getFeaturedImageUrl(post);

        return `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${description}]]></description>
      <pubDate>${pubDate}</pubDate>
      ${imageUrl ? `<enclosure url="${imageUrl}" type="image/jpeg" />` : ''}
    </item>`;
    }).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Semicolon; - 기술의 미래를 읽다</title>
    <link>${baseUrl}</link>
    <description>AI, 가젯, 소프트웨어의 최신 트렌드를 가장 쉽고 깊이 있게 전달합니다.</description>
    <language>ko-KR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/api/rss" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

    return new Response(rss, {
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600"
        }
    });
}
