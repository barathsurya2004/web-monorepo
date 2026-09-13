/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Newsreader', 'Charter', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        dawn: {
          bg: '#F7F4EE',
          surface: '#FFFFFF',
          warm: '#FAF7F2',
          pebble: '#F2EDE2',
          border: 'rgba(218, 208, 194, 0.65)',
        },
        moss: {
          bg: '#141715',
          surface: '#1C221E',
          warm: '#222924',
          pebble: '#27302A',
          border: 'rgba(72, 85, 77, 0.4)',
        },
        clay: {
          DEFAULT: '#C8634B',
          soft: '#FBF0EB',
          border: '#F3CEC3',
          dark: '#E37B62',
        },
        matcha: {
          DEFAULT: '#537D63',
          soft: '#EEF5F1',
          border: '#C6DFD0',
          dark: '#6FAF82',
        },
        ochre: {
          DEFAULT: '#C49045',
          soft: '#FAF4E8',
          border: '#EED9B3',
          dark: '#DBA458',
        },
        river: {
          DEFAULT: '#4C7285',
          soft: '#EFF5F8',
          border: '#C3DCE7',
          dark: '#6DA4BD',
        },
        plum: {
          DEFAULT: '#835B74',
          soft: '#F7EFF5',
          border: '#E5CDDE',
          dark: '#B885A5',
        },
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
        }
      },
      borderRadius: {
        'pebble-1': '1.25rem',
        'pebble-2': '1.25rem',
        'pebble-3': '1.25rem',
        'fluid': '9999px',
      },
      keyframes: {
        waveRotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        gentleFloat: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-3px)' },
        },
        softBreathe: {
          '0%': { transform: 'scale(0.95)', opacity: '0.6' },
          '100%': { transform: 'scale(1.15)', opacity: '0.9' },
        }
      },
      animation: {
        waveRotate: 'waveRotate 5s linear infinite',
        gentleFloat: 'gentleFloat 6s ease-in-out infinite alternate',
        softBreathe: 'softBreathe 5s ease-in-out infinite alternate',
      }
    },
  },
  plugins: [],
}
