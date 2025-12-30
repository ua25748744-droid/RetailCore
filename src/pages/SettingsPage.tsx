import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Settings, Moon, Sun, Globe, Database, Info } from 'lucide-react';

export const SettingsPage: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const { currentLanguage, setLanguage, isRTL } = useLanguage();

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-xl bg-primary-500/10">
                    <Settings className="w-8 h-8 text-primary-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        {isRTL ? 'ترتیبات' : 'Settings'}
                    </h1>
                    <p className="text-muted text-sm">
                        {isRTL ? 'ایپ کی ترتیبات کا نظم کریں' : 'Manage your app preferences'}
                    </p>
                </div>
            </div>

            {/* Appearance Section */}
            <section className="card">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Sun className="w-5 h-5 text-amber-400" />
                    {isRTL ? 'ظاہری شکل' : 'Appearance'}
                </h2>

                <div className="space-y-4">
                    {/* Theme Selection */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-surface/50 border border-border/50">
                        <div className="flex items-center gap-3">
                            {theme === 'deep-dark' ? (
                                <Moon className="w-5 h-5 text-indigo-400" />
                            ) : (
                                <Sun className="w-5 h-5 text-amber-400" />
                            )}
                            <div>
                                <p className="font-medium text-foreground">
                                    {isRTL ? 'تھیم' : 'Theme'}
                                </p>
                                <p className="text-xs text-muted">
                                    {isRTL ? 'روشن یا ڈارک موڈ منتخب کریں' : 'Choose light or dark mode'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setTheme('deep-dark')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${theme === 'deep-dark'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-surface border border-border text-muted hover:text-foreground'
                                    }`}
                            >
                                <Moon className="w-4 h-4 inline mr-1" />
                                {isRTL ? 'ڈارک' : 'Dark'}
                            </button>
                            <button
                                onClick={() => setTheme('light')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${theme === 'light'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-surface border border-border text-muted hover:text-foreground'
                                    }`}
                            >
                                <Sun className="w-4 h-4 inline mr-1" />
                                {isRTL ? 'روشن' : 'Light'}
                            </button>
                        </div>
                    </div>

                    {/* Language Selection */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-surface/50 border border-border/50">
                        <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-blue-400" />
                            <div>
                                <p className="font-medium text-foreground">
                                    {isRTL ? 'زبان' : 'Language'}
                                </p>
                                <p className="text-xs text-muted">
                                    {isRTL ? 'ایپ کی زبان منتخب کریں' : 'Select app language'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setLanguage('en')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentLanguage === 'en'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-surface border border-border text-muted hover:text-foreground'
                                    }`}
                            >
                                English
                            </button>
                            <button
                                onClick={() => setLanguage('ur')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all font-urdu ${currentLanguage === 'ur'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-surface border border-border text-muted hover:text-foreground'
                                    }`}
                            >
                                اردو
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Data & Storage Section */}
            <section className="card">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-400" />
                    {isRTL ? 'ڈیٹا اور سٹوریج' : 'Data & Storage'}
                </h2>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-surface/50 border border-border/50">
                        <div>
                            <p className="font-medium text-foreground">
                                {isRTL ? 'آف لائن ڈیٹابیس' : 'Offline Database'}
                            </p>
                            <p className="text-xs text-muted">
                                {isRTL ? 'SQLite IndexedDB میں محفوظ' : 'Stored in SQLite IndexedDB'}
                            </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                            {isRTL ? 'فعال' : 'Active'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-surface/50 border border-border/50">
                        <div>
                            <p className="font-medium text-foreground">
                                {isRTL ? 'ڈیٹا ایکسپورٹ' : 'Export Data'}
                            </p>
                            <p className="text-xs text-muted">
                                {isRTL ? 'اپنا ڈیٹا JSON میں ڈاؤنلوڈ کریں' : 'Download your data as JSON'}
                            </p>
                        </div>
                        <button className="btn-secondary text-sm">
                            {isRTL ? 'ایکسپورٹ' : 'Export'}
                        </button>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="card">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-400" />
                    {isRTL ? 'کے بارے میں' : 'About'}
                </h2>

                <div className="p-4 rounded-xl bg-surface/50 border border-border/50">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 p-0.5">
                            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-card text-xl font-bold text-foreground">
                                RC
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground">RetailCore</h3>
                            <p className="text-sm text-muted">
                                {isRTL ? 'ورژن 1.0.0' : 'Version 1.0.0'}
                            </p>
                            <p className="text-xs text-muted mt-1">
                                {isRTL ? 'مقامی مارکیٹ کے لیے آف لائن POS' : 'Offline-first POS for local markets'}
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default SettingsPage;
