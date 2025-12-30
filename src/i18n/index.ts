import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en.json';
import ur from '../locales/ur.json';

const resources = {
    en: { translation: en },
    ur: { translation: ur },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        supportedLngs: ['en', 'ur'],

        detection: {
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: 'retailcore-language',
            caches: ['localStorage'],
        },

        interpolation: {
            escapeValue: false,
        },

        react: {
            useSuspense: false,
        },
    });

// Update document direction when language changes
i18n.on('languageChanged', (lng) => {
    const dir = lng === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lng);
    localStorage.setItem('retailcore-language', lng);
});

// Set initial direction
const initialLang = localStorage.getItem('retailcore-language') || 'en';
document.documentElement.setAttribute('dir', initialLang === 'ur' ? 'rtl' : 'ltr');
document.documentElement.setAttribute('lang', initialLang);

export default i18n;
