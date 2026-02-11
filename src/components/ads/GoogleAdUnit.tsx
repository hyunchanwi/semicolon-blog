'use client';

import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

interface GoogleAdUnitProps {
    /**
     * The Data Ad Slot ID from Google AdSense.
     * Example: "1234567890"
     */
    slotId: string;
    /**
     * The AdSense Publisher ID.
     * Defaults to the site's publisher ID if not provided.
     */
    publisherId?: string;
    /**
     * Ad format (auto, rectangle, horizontal, etc.)
     * Default: "auto"
     */
    format?: 'auto' | 'fluid' | 'rectangle';
    /**
     * Whether the ad should be responsive (full width).
     * Default: true
     */
    responsive?: boolean;
    /**
     * Ad layout (e.g., "in-article")
     */
    layout?: string;
    /**
     * Custom class names for the container.
     */
    className?: string;
    /**
     * Custom style for the ins element.
     */
    style?: React.CSSProperties;
}

export function GoogleAdUnit({
    slotId,
    publisherId = 'ca-pub-7603530695362433', // Default Publisher ID
    format = 'auto',
    layout,
    responsive = true,
    className = '',
    style = { display: 'block' },
}: GoogleAdUnitProps) {
    const adRef = useRef<HTMLModElement>(null);

    useEffect(() => {
        try {
            // Check if the ad is already populated (to prevent duplicate push in React Strict Mode)
            if (adRef.current && adRef.current.innerHTML === '') {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            }
        } catch (err) {
            console.error('Google AdSense error:', err);
        }
    }, []);

    if (process.env.NODE_ENV === 'development') {
        return (
            <div
                className={`bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-500 font-medium p-4 ${className}`}
                style={{ minHeight: '280px', ...style }}
            >
                Google AdSense Unit (Slot: {slotId})
                <br />
                Publisher: {publisherId}
            </div>
        );
    }

    const combinedStyle = layout === 'in-article'
        ? { ...style, textAlign: 'center' as const }
        : style;

    return (
        <div className={`google-ad-container ${className} my-8`}>
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={combinedStyle}
                data-ad-client={publisherId}
                data-ad-slot={slotId}
                data-ad-format={format}
                data-ad-layout={layout}
                data-full-width-responsive={responsive ? 'true' : 'false'}
            />
        </div>
    );
}
