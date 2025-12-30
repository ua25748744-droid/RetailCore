/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
        urdu: ['Noto Nastaliq Urdu', 'serif'],
      },
      colors: {
        background: 'rgb(var(--color-bg-primary) / <alpha-value>)',
        surface: 'rgb(var(--color-bg-secondary) / <alpha-value>)',
        card: 'rgb(var(--color-bg-card) / <alpha-value>)',

        foreground: 'rgb(var(--color-text-primary) / <alpha-value>)',
        muted: 'rgb(var(--color-text-secondary) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',

        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: 'rgb(var(--color-brand-accent) / <alpha-value>)', // Accent
          500: 'rgb(var(--color-brand-primary) / <alpha-value>)', // Main Brand
          600: 'rgb(var(--color-brand-secondary) / <alpha-value>)', // Secondary Brand
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        secondary: {
          400: 'rgb(var(--color-brand-secondary) / <alpha-value>)',
        },
        accent: {
          400: 'rgb(var(--color-brand-accent) / <alpha-value>)',
          500: 'rgb(var(--color-brand-accent) / <alpha-value>)',
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
