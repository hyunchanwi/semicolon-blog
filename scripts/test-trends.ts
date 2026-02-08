/**
 * 트렌드 헌터 테스트 스크립트
 */

async function getTrendingFromRSS(geo: string = 'KR') {
    try {
        console.log(`[Trends] Fetching trends from RSS for ${geo}...`);

        const response = await fetch(`https://trends.google.com/trending/rss?geo=${geo}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml',
            },
        });

        if (!response.ok) {
            throw new Error(`RSS fetch failed: ${response.status}`);
        }

        const xml = await response.text();
        console.log('Raw response (first 500 chars):', xml.substring(0, 500));

        // Simple XML parsing for <item><title>
        const itemRegex = /<item>[\s\S]*?<title>([^<]+)<\/title>[\s\S]*?<\/item>/g;

        const topics: { title: string; traffic: string }[] = [];
        let match;

        while ((match = itemRegex.exec(xml)) !== null) {
            const title = match[1].trim();
            if (title && !title.startsWith('Daily Search')) {
                topics.push({ title, traffic: '10K+' });
            }
        }

        return topics;

    } catch (error) {
        console.error('[Trends] RSS fetch error:', error);
        return [];
    }
}

async function testTrends() {
    console.log('=== 🧠 트렌드 헌터 RSS 테스트 ===\n');

    const trends = await getTrendingFromRSS('KR');
    console.log(`\n발견된 트렌드: ${trends.length}개\n`);

    if (trends.length > 0) {
        console.log('상위 10개:');
        trends.slice(0, 10).forEach((t, i) => {
            console.log(`${i + 1}. ${t.title}`);
        });
    }
}

testTrends().catch(console.error);
