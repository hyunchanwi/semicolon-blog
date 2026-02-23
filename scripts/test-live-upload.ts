import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function uploadTest() {
    const formData = new FormData();
    // dummy 1x1 png
    const buffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
    const blob = new Blob([buffer], { type: 'image/png' });
    formData.append('file', blob, 'test.png');

    try {
        // We will test against the live site first without session cookies,
        // which should return 401 Unauthorized. If it returns 500, something else is wrong.
        const res = await fetch('https://semicolonittech.com/api/admin/upload', {
            method: 'POST',
            body: formData
        });

        console.log("Status:", res.status);
        console.log("Text:", await res.text());
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

uploadTest();
