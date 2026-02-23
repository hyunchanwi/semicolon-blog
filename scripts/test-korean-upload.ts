import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'fs';

async function uploadKoreanFilenameTest() {
    const formData = new FormData();
    const buffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
    const blob = new Blob([buffer], { type: 'image/png' });
    formData.append('file', blob, '테스트 이 미 지.png');

    try {
        const res = await fetch('http://localhost:3000/api/admin/upload', {
            method: 'POST',
            body: formData,
            headers: {
                // To mock the session, we'd need a valid cookie. Let's just bypass auth locally 
                // by temporarily commenting it out in route.ts, or just see if we hit auth or 500.
            }
        });

        console.log("Status:", res.status);
        console.log("Text:", await res.text());
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

uploadKoreanFilenameTest();
