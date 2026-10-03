import type { Config } from 'tailwindcss'
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#030a22', 'bg-deep': '#02061a', card: '#07163f',
        accent: { DEFAULT: '#0070f8', hi: '#4da3ff', glow: '#8cc6ff' },
        muted: '#a7b9d4', text: '#dce7f7', line: 'rgba(91,156,225,.32)', 'line-strong': 'rgba(91,156,225,.8)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      keyframes: {
        'step-in': { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'none' } },
        'pop-in': { from: { opacity: '0', transform: 'scale(.9) translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
        shimmer: { to: { backgroundPosition: '-200% 0' } },
        'ping-soft': { '0%': { boxShadow: '0 0 0 0 rgba(77,163,255,.5)' }, '100%': { boxShadow: '0 0 0 10px rgba(77,163,255,0)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-5px)' } },
      },
      animation: {
        'step-in': 'step-in .45s cubic-bezier(.16,1,.3,1)', 'pop-in': 'pop-in .35s cubic-bezier(.16,1,.3,1) both',
        shimmer: 'shimmer 1.6s linear infinite', 'ping-soft': 'ping-soft 2s ease-out infinite', float: 'float 4s ease-in-out infinite',
      },
    },
  },
} satisfies Config
