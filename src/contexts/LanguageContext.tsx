import React, { createContext, useContext, useCallback, useMemo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type Language = 'en' | 'ur';

interface LanguageContextType {
    currentLanguage: Language;
    isRTL: boolean;
    toggleLanguage: () => void;
    setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { i18n } = useTranslation();
    const [currentLanguage, setCurrentLanguage] = useState<Language>(
        (i18n.language as Language) || 'en'
    );

    const isRTL = useMemo(() => currentLanguage === 'ur', [currentLanguage]);

    const setLanguage = useCallback((lang: Language) => {
        i18n.changeLanguage(lang);
        setCurrentLanguage(lang);
    }, [i18n]);

    const toggleLanguage = useCallback(() => {
        const newLang: Language = currentLanguage === 'en' ? 'ur' : 'en';
        setLanguage(newLang);
    }, [currentLanguage, setLanguage]);

    // Sync with i18n language changes
    useEffect(() => {
        const handleLanguageChange = (lng: string) => {
            setCurrentLanguage(lng as Language);
        };

        i18n.on('languageChanged', handleLanguageChange);
        return () => {
            i18n.off('languageChanged', handleLanguageChange);
        };
    }, [i18n]);

    const value = useMemo(() => ({
        currentLanguage,
        isRTL,
        toggleLanguage,
        setLanguage,
    }), [currentLanguage, isRTL, toggleLanguage, setLanguage]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export default LanguageContext;
