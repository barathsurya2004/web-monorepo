/** @type {import('tailwindcss').Config} */
export default {
  // Include the shared UI package so its utility classes are generated.
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Aligned with the workspace velvet palette used by @packages/ui.
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
          '0%': { transform: 'scale(0.85)' },
          '55%': { transform: 'scale(1.12)' },
          '100%': { transform: 'scale(1)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        sheet: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fade: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        toast: {
          '0%': { opacity: '0', transform: 'translateY(-16px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        pop: 'pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        rise: 'rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        sheet: 'sheet 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        fade: 'fade 0.25s ease-out',
        shimmer: 'shimmer 2.4s linear infinite',
        heartbeat: 'heartbeat 1s ease-in-out infinite',
        toast: 'toast 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        spinSlow: 'spinSlow 18s linear infinite',
      },
    },
  },
  plugins: [],
};
