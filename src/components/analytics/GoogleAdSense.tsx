"use client";

import Script from "next/script";

type Props = {
    pId: string;
};

export default function GoogleAdSense({ pId }: Props) {
    if (process.env.NODE_ENV !== "production") {
        return null;
    }

    return (
        <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7603530695362433`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
        />
    );
}
