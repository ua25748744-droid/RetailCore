import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export const ThemeSwitcher: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="group relative overflow-hidden rounded-xl px-3 py-2.5 transition-all duration-300 
                 hover:shadow-lg flex items-center gap-2"
            style={{
                backgroundColor: 'rgb(var(--color-bg-secondary))',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'rgb(var(--color-border))',
            }}
            title={`Switch to ${theme === 'deep-dark' ? 'Light' : 'Deep Dark'} Mode`}
        >
            <div className="relative flex items-center justify-center gap-2">
                <div className={`transition-all duration-300 transform ${theme === 'light' ? 'scale-100 rotate-0' : 'scale-0 rotate-90 absolute'}`}>
                    <Sun className="w-5 h-5" style={{ color: 'rgb(var(--color-warning))' }} />
                </div>
                <div className={`transition-all duration-300 transform ${theme === 'deep-dark' ? 'scale-100 rotate-0' : 'scale-0 -rotate-90 absolute'}`}>
                    <Moon className="w-5 h-5" style={{ color: 'rgb(var(--color-brand-accent))' }} />
                </div>
                <span
                    className="hidden md:block text-sm font-medium transition-colors"
                    style={{ color: 'rgb(var(--color-text-primary))' }}
                >
                    {theme === 'light' ? 'Light' : 'Dark'}
                </span>
            </div>
        </button>
    );
};

