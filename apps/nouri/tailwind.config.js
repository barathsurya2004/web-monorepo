/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0A0918',
          900: '#0F0D24',
          850: '#1A1835',
          800: '#232044',
          750: '#2C2856',
          700: '#343060',
          600: '#3D3870',
          500: '#4D4786',
        },
        fg: '#F5F3FF',
        muted: '#94A3B8',
        dim: '#64748B',
        mint: '#A8E6CF',
        peach: '#FBD8B3',
        lav: '#C8B6FF',
        coral: '#FFB5A7',
        amber: '#FDE2B8',
        ice: '#A5D8FF',
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.92)' },
          '60%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.03)' },
        },
      },
      animation: {
        pop: 'pop 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        rise: 'rise 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        pulseGlow: 'pulseGlow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
