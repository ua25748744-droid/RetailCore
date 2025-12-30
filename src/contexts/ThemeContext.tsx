import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'deep-dark' | 'light';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        // Check local storage or default to 'vibrant'
        const saved = localStorage.getItem('retailcore-theme');
        return (saved === 'deep-dark' || saved === 'light') ? (saved as Theme) : 'deep-dark';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.setAttribute('data-theme', theme);
        localStorage.setItem('retailcore-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'deep-dark' ? 'light' : 'deep-dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
