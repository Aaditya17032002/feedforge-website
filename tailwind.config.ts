import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'teal': '#1f2937',
        'teal-dark': '#111827',
        'accent': '#090088',
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'serif'],
        vector: ['Segoe UI', '-apple-system', 'BlinkMacSystemFont', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
      },
      keyframes: {
        'page-enter': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-33.333%)' },
        },
        'scroll-reverse': {
          '0%': { transform: 'translateX(-33.333%)' },
          '100%': { transform: 'translateX(0)' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'generate-btn-gradient': {
          '0%, 100%': { backgroundPosition: '15% 50%' },
          '50%': { backgroundPosition: '85% 50%' },
        },
        'score-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(9, 0, 136, 0.45), 0 0 0 0 rgba(9, 0, 136, 0)' },
          '50%': { boxShadow: '0 0 0 4px rgba(9, 0, 136, 0.15), 0 0 18px 2px rgba(9, 0, 136, 0.45)' },
        },
        'border-sweep': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
      animation: {
        'page-enter': 'page-enter 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
        scroll: 'scroll 30s linear infinite',
        'scroll-reverse': 'scroll-reverse 30s linear infinite',
        bounce: 'bounce 2s ease-in-out infinite',
        'generate-btn-gradient': 'generate-btn-gradient 2.4s ease-in-out infinite',
        'score-glow': 'score-glow 2.4s ease-in-out infinite',
        'border-sweep': 'border-sweep 3s linear infinite',
      },
    },
  },
  plugins: [],
}
export default config

