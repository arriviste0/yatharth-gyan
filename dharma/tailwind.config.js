/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* Reference Soft Pastel Palette */
        pastel: {
          canvas: '#F4F7F6',
          darkCanvas: '#0F111A',
          card: '#FFFFFF',
          darkCard: '#181A26',
          yellow: '#FEF3D6',
          yellowText: '#855B14',
          mint: '#E1F5E9',
          mintText: '#1B633A',
          purple: '#EAE5FF',
          purpleText: '#4A34A3',
          blue: '#E0F2FE',
          blueText: '#0369A1',
          peach: '#FFEAD2',
          peachText: '#9A4112',
          coral: '#FFE5E5',
          coralText: '#991B1B',
          darkPill: '#18191E',
          subtleBorder: '#EFEFEF',
        },
        /* ASCEND System Palette */
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
        stat: {
          mind: '#A855F7',
          health: '#10B981',
          wealth: '#F59E0B',
          custom: '#00F0FF',
        },
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      fontFamily: {
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
        stat: ['Plus Jakarta Sans', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'Outfit', 'system-ui', 'sans-serif'],
        devanagari: ['Tiro Devanagari Hindi', 'Mukta', 'serif'],
      },
      boxShadow: {
        'card-subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        'card-float': '0 12px 32px -4px rgba(0, 0, 0, 0.06), 0 4px 12px -2px rgba(0, 0, 0, 0.03)',
        'hud-glass': 'inset 0 0 15px rgba(79, 140, 255, 0.08), 0 8px 32px rgba(0, 0, 0, 0.6)',
        'hud-cyan': 'inset 0 0 20px rgba(0, 240, 255, 0.15), 0 0 25px rgba(0, 240, 255, 0.3)',
      },
      animation: {
        'xp-shimmer': 'xp-shimmer 2s infinite',
        'system-flash': 'system-flash 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'rank-pulse': 'rank-pulse 2.5s infinite ease-in-out',
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
      },
    },
  },
  plugins: [],
}
