import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createPost } from '../src/lib/wp-admin-api';
import { Agent, fetch as undiciFetch } from 'undici';

const WP_API_URL = "https://wp.semicolonittech.com/wp-json/wp/v2";
const WP_AUTH = process.env.WP_AUTH || "";

const _http1Agent = new Agent({ allowH2: false });
const wpFetch = (url: string, opts: any = {}) => undiciFetch(url, { ...opts, dispatcher: _http1Agent }) as any;

async function main() {
    console.log("WP_AUTH available:", !!WP_AUTH);

    try {
        console.log("1. Testing Post Creation...");
        const res = await wpFetch(`${WP_API_URL}/posts`, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${WP_AUTH}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: "Test Post Admin Direct",
                content: "Content",
                status: "draft"
            })
        });

        if (!res.ok) {
            const err = await res.text();
            console.error("Post creation failed:", res.status, err);
        } else {
            const post = await res.json();
            console.log("Post creation success. ID:", post.id);
        }
    } catch (e: any) {
        console.error("Post creation failed:", e.message);
    }

    try {
        console.log("\n2. Testing Image Upload...");
        // Dummy 1x1 transparent PNG
        const binaryData = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

        const _http1Agent = new Agent({ allowH2: false });
        const wpFetch = (url: string, opts: any = {}) => undiciFetch(url, { ...opts, dispatcher: _http1Agent }) as any;

        const res = await wpFetch(`${WP_API_URL}/media`, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${WP_AUTH}`,
                "Content-Type": "image/png",
                "Content-Disposition": `attachment; filename="test-upload.png"`,
            },
            body: binaryData,
        });

        if (!res.ok) {
            const err = await res.text();
            console.error("Image upload failed:", res.status, err);
        } else {
            const data = await res.json();
            console.log("Image upload success. URL:", data.source_url);
        }
    } catch (e: any) {
        console.error("Image upload exception:", e.message);
    }
}

main();
