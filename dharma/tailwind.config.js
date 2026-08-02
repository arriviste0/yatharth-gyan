/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ASCEND System Theme Colors */
        system: {
          bg: '#0B0E1A',
          panel: 'rgba(13, 18, 36, 0.85)',
          card: '#0D1224',
          border: 'rgba(79, 140, 255, 0.35)',
          'border-hover': 'rgba(0, 240, 255, 0.6)',
        },
        cyan: {
          DEFAULT: '#00F0FF',
          hud: '#4F8CFF',
          glow: 'rgba(0, 240, 255, 0.4)',
        },
        violet: {
          DEFAULT: '#A855F7',
          glow: 'rgba(168, 85, 247, 0.4)',
        },
        penalty: {
          red: '#FF4D4D',
          dark: '#1A0C12',
        },
        rank: {
          e: '#94A3B8',
          d: '#10B981',
          c: '#06B6D4',
          b: '#3B82F6',
          a: '#A855F7',
          s: '#F59E0B',
        },
        /* Stat Attribute Categories (Mind / Health / Wealth + Dynamic) */
        stat: {
          mind: '#A855F7',
          health: '#10B981',
          wealth: '#F59E0B',
          custom: '#00F0FF',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'Rajdhani', 'sans-serif'],
        stat: ['Rajdhani', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'Outfit', 'system-ui', 'sans-serif'],
        devanagari: ['Tiro Devanagari Hindi', 'Mukta', 'serif'],
      },
      boxShadow: {
        'hud-glass': 'inset 0 0 15px rgba(79, 140, 255, 0.08), 0 8px 32px rgba(0, 0, 0, 0.6)',
        'hud-cyan': 'inset 0 0 20px rgba(0, 240, 255, 0.15), 0 0 25px rgba(0, 240, 255, 0.3)',
        'hud-violet': 'inset 0 0 20px rgba(168, 85, 247, 0.15), 0 0 25px rgba(168, 85, 247, 0.3)',
        'hud-warning': 'inset 0 0 15px rgba(255, 77, 77, 0.12), 0 0 25px rgba(255, 77, 77, 0.25)',
        'hud-gold': 'inset 0 0 25px rgba(245, 158, 11, 0.2), 0 0 35px rgba(245, 158, 11, 0.4)',
      },
      animation: {
        'xp-shimmer': 'xp-shimmer 2s infinite',
        'system-flash': 'system-flash 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'rank-pulse': 'rank-pulse 2.5s infinite ease-in-out',
        'hud-scan': 'hud-scan 8s linear infinite',
      },
      keyframes: {
        'xp-shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'system-flash': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'rank-pulse': {
          '0%, 100%': { boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 240, 255, 0.9)' },
        },
        'hud-scan': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100%' },
        },
      },
    },
  },
  plugins: [],
}
