
import https from 'https';

async function getChannelId(handle: string) {
    const url = `https://www.youtube.com/${handle}`;
    console.log(`Fetching ${url}...`);

    https.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            const metaMatch = data.match(/itemprop="channelId" content="([^"]+)"/);
            const browseIdMatch = data.match(/"browseId":"([^"]+)"/);

            if (metaMatch) {
                console.log(`Found via Meta: ${metaMatch[1]}`);
            } else if (browseIdMatch) {
                console.log(`Found via BrowseId: ${browseIdMatch[1]}`);
            } else {
                console.log("Could not find channel ID.");
            }
        });
    }).on('error', (e) => {
        console.error(e);
    });
}

getChannelId('@zuyoni1');
