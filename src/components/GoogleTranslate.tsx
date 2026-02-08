"use client";

import { useEffect } from "react";

declare global {
    interface Window {
        google: any;
        googleTranslateElementInit: () => void;
    }
}

export const GoogleTranslate = () => {
    useEffect(() => {
        // Define the init function
        window.googleTranslateElementInit = () => {
            new window.google.translate.TranslateElement(
                {
                    pageLanguage: "ko",
                    includedLanguages: "ko,en,ja,zh-CN",
                    layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false,
                },
                "google_translate_element"
            );
        };

        // Load the Google Translate script
        const script = document.createElement("script");
        script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            // Cleanup
            const scripts = document.querySelectorAll('script[src*="translate.google.com"]');
            scripts.forEach((s) => s.remove());
        };
    }, []);

    return (
        <div
            id="google_translate_element"
            className="hidden"
        />
    );
};

// Language switcher hook
// Language switcher hook
export const useLanguageSwitch = () => {
    const switchToKorean = () => {
        // Clear existing cookies to avoid conflicts
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;

        // Set new cookie
        document.cookie = "googtrans=/auto/ko; path=/";
        document.cookie = "googtrans=/auto/ko; path=/; domain=" + window.location.hostname;
        window.location.reload();
    };

    const switchToEnglish = () => {
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;

        document.cookie = "googtrans=/auto/en; path=/";
        document.cookie = "googtrans=/auto/en; path=/; domain=" + window.location.hostname;
        window.location.reload();
    };

    return { switchToKorean, switchToEnglish };
};
