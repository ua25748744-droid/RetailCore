import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher: React.FC = () => {
    const { toggleLanguage, currentLanguage, isRTL } = useLanguage();
    useTranslation();

    return (
        <button
            onClick={toggleLanguage}
            className="group relative overflow-hidden rounded-xl px-4 py-2.5 transition-all duration-300 
                 hover:shadow-lg flex items-center gap-3"
            style={{
                backgroundColor: 'rgb(var(--color-bg-secondary))',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'rgb(var(--color-border))',
            }}
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            {/* Content */}
            <div className="relative flex items-center gap-3">
                {/* Language indicator */}
                <div className="flex items-center gap-2">
                    <span
                        className="text-sm font-medium transition-all duration-300"
                        style={{
                            color: currentLanguage === 'en'
                                ? 'rgb(var(--color-brand-primary))'
                                : 'rgb(var(--color-text-muted))'
                        }}
                    >
                        EN
                    </span>

                    {/* Toggle switch */}
                    <div
                        className="relative h-6 w-12 rounded-full p-0.5"
                        style={{ backgroundColor: 'rgb(var(--color-bg-primary))' }}
                    >
                        <div
                            className="absolute top-0.5 h-5 w-5 rounded-full shadow-lg transition-all duration-300 ease-out"
                            style={{
                                backgroundColor: 'rgb(var(--color-brand-primary))',
                                left: currentLanguage === 'ur' ? '24px' : '2px'
                            }}
                        />
                    </div>

                    <span
                        className="text-sm font-medium transition-all duration-300 font-urdu"
                        style={{
                            color: currentLanguage === 'ur'
                                ? 'rgb(var(--color-brand-primary))'
                                : 'rgb(var(--color-text-muted))'
                        }}
                    >
                        اردو
                    </span>
                </div>
            </div>
        </button>
    );
};

export default LanguageSwitcher;
