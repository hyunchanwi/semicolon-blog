import { fetch } from "undici";

async function isShort(videoId: string) {
    const res = await fetch(`https://www.youtube.com/shorts/${videoId}`, {
        method: 'HEAD',
        redirect: 'manual'
    });
    console.log(`Video ID: ${videoId}, Status: ${res.status}, Location: ${res.headers.get('location')}`);
    return res.status === 200;
}

async function run() {
    // A known short
    await isShort("M2-N_37p3b0"); // Random short ID if we know one, let's just pick any ID
    // A known long video
    await isShort("UqMy_8RoawA"); // 주연 iphone fold video
}
run();
