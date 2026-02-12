"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { dictionary, Language } from './dictionary';

type Dictionary = typeof dictionary.TH;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    // Default to TH as requested
    const [language, setLanguageState] = useState<Language>('TH');

    useEffect(() => {
        // Check localStorage for saved preference
        const savedLang = localStorage.getItem('app_language') as Language;
        if (savedLang && (savedLang === 'TH' || savedLang === 'EN')) {
            setLanguageState(savedLang);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('app_language', lang);
    };

    const t = dictionary[language];

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
