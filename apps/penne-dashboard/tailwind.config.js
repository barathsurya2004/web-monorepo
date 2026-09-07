/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        indigo: {
          950: '#1A1835',
          900: '#232044',
          850: '#2A2650',
          800: '#322E5C',
          750: '#3A3669',
          700: '#433E77',
          650: '#4D4786',
          600: '#5A539B',
        },
        apricot: {
          DEFAULT: '#FBD8B3',
          light: '#FDEBD6',
          soft: '#FCE0C2',
          card: '#FCE3CB',
          deep: '#F7C495',
          dark: '#2A2548',
        },
        pastel: {
          sky: '#A7D7F9',
          lilac: '#C8B6FF',
          coral: '#FFB5A7',
          mint: '#A8E6CF',
          cream: '#FDE2B8',
          rose: '#FFAAA6',
        },
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out forwards',
        pulseSlow: 'pulseSlow 3s infinite ease-in-out',
      }
    },
  },
  plugins: [],
}
