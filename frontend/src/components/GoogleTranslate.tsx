"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

declare global {
    interface Window {
        google: any;
        googleTranslateElementInit: () => void;
    }
}

const languages = [
    { label: "English", code: "en" },
    { label: "हिन्दी (Hindi)", code: "hi" },
    { label: "বাংলা (Bengali)", code: "bn" },
    { label: "తెలుగు (Telugu)", code: "te" },
    { label: "मराठी (Marathi)", code: "mr" },
    { label: "தமிழ் (Tamil)", code: "ta" },
    { label: "ગુજરાતી (Gujarati)", code: "gu" },
    { label: "ಕನ್ನಡ (Kannada)", code: "kn" },
    { label: "മലയാളം (Malayalam)", code: "ml" },
    { label: "ਪੰਜਾਬੀ (Punjabi)", code: "pa" },
];

export const GoogleTranslate = () => {
    const [currentLang, setCurrentLang] = useState("English");

    useEffect(() => {
        window.googleTranslateElementInit = () => {
            new window.google.translate.TranslateElement(
                {
                    pageLanguage: "en",
                    includedLanguages: "en,hi,bn,te,mr,ta,gu,kn,ml,pa",
                    autoDisplay: false,
                },
                "google_translate_element_hidden"
            );
        };
    }, []);

    const changeLanguage = (langCode: string, label: string) => {
        setCurrentLang(label);
        const select = document.querySelector(".goog-te-combo") as HTMLSelectElement;
        if (select) {
            select.value = langCode;
            select.dispatchEvent(new Event("change"));
        }
    };

    return (
        <>
            <div id="google_translate_element_hidden" style={{ display: "none" }} />
            <Script
                src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
                strategy="afterInteractive"
            />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-3 h-10 rounded-full bg-secondary/50 hover:bg-secondary">
                        <span className="text-lg">🌐</span>
                        <span className="hidden md:inline-block font-medium text-sm">{currentLang}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 max-h-80 overflow-y-auto rounded-xl border-secondary shadow-xl">
                    {languages.map((lang) => (
                        <DropdownMenuItem
                            key={lang.code}
                            className="px-4 py-2 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors font-medium"
                            onClick={() => changeLanguage(lang.code, lang.label)}
                        >
                            {lang.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <style jsx global>{`
        /* Hide Google Translate's ugly top bar */
        .goog-te-banner-frame.skiptranslate {
          display: none !important;
        }
        body {
          top: 0 !important;
        }
        .goog-tooltip {
          display: none !important;
        }
        .goog-tooltip:hover {
          display: none !important;
        }
        .goog-text-highlight {
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        /* Hide the skip link */
        #goog-gt-tt, .goog-te-balloon-frame {
          display: none !important;
        }
      `}</style>
        </>
    );
};
