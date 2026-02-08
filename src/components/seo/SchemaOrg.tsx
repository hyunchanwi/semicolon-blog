"use client";

import Script from "next/script";

interface SchemaOrgProps {
    type: "WebSite" | "Article" | "BlogPosting";
    title?: string;
    description?: string;
    url?: string;
    datePublished?: string;
    dateModified?: string;
    author?: string;
    image?: string;
}

export function SchemaOrg({
    type,
    title,
    description,
    url,
    datePublished,
    dateModified,
    author = "Semicolon;",
    image,
}: SchemaOrgProps) {
    const baseUrl = "https://semicolonittech.com";

    let schema: Record<string, unknown>;

    if (type === "WebSite") {
        schema = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Semicolon;",
            alternateName: "세미콜론",
            url: baseUrl,
            description: "AI, 가젯, 소프트웨어의 최신 트렌드를 가장 쉽고 깊이 있게 전달합니다.",
            publisher: {
                "@type": "Organization",
                name: "Semicolon;",
                url: baseUrl,
                logo: {
                    "@type": "ImageObject",
                    url: `${baseUrl}/logo.png`,
                },
            },
            potentialAction: {
                "@type": "SearchAction",
                target: {
                    "@type": "EntryPoint",
                    urlTemplate: `${baseUrl}/blog?search={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
            },
        };
    } else {
        // Article or BlogPosting
        schema = {
            "@context": "https://schema.org",
            "@type": type,
            headline: title,
            description: description,
            url: url || baseUrl,
            datePublished: datePublished,
            dateModified: dateModified || datePublished,
            author: {
                "@type": "Person",
                name: author,
            },
            publisher: {
                "@type": "Organization",
                name: "Semicolon;",
                url: baseUrl,
                logo: {
                    "@type": "ImageObject",
                    url: `${baseUrl}/logo.png`,
                },
            },
            mainEntityOfPage: {
                "@type": "WebPage",
                "@id": url || baseUrl,
            },
            ...(image && {
                image: {
                    "@type": "ImageObject",
                    url: image,
                },
            }),
        };
    }

    return (
        <Script
            id={`schema-org-${type.toLowerCase()}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
