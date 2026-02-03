"use client";

import * as React from "react";
import { Language, translations } from "@/lib/translations";

// Create a type that accepts both vi and en translations
type TranslationsType = typeof translations.vi | typeof translations.en;

type LanguageContextType = {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: TranslationsType;
};

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "jira-dashboard-language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = React.useState<Language>("vi");
    const [mounted, setMounted] = React.useState(false);

    // Load language from localStorage on mount
    React.useEffect(() => {
        setMounted(true);
        const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
        if (savedLanguage && (savedLanguage === "vi" || savedLanguage === "en")) {
            setLanguageState(savedLanguage);
        }
    }, []);

    const setLanguage = React.useCallback((lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
        // Update html lang attribute
        document.documentElement.lang = lang;
    }, []);

    const t = translations[language];

    // Prevent hydration mismatch
    if (!mounted) {
        return (
            <LanguageContext.Provider value={{ language: "vi", setLanguage, t: translations.vi }}>
                {children}
            </LanguageContext.Provider>
        );
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = React.useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
