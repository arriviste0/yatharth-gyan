/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        parchment: '#FAF6F0',
        night: '#0F1429',
        'indigo-deep': '#2D3561',
        'indigo-mid': '#3D4880',
        'indigo-light': '#5B6BAF',
        saffron: '#E8843C',
        'saffron-light': '#F0A060',
        'saffron-dark': '#C46828',
        gold: '#C9A961',
        'gold-light': '#DFC07A',
        'gold-dark': '#A88840',
        'teal-muted': '#5A8A8A',
        'teal-light': '#7AABAB',
        charcoal: '#2A2A2A',
        cream: '#E8E0D0',
      },
      fontFamily: {
        devanagari: ['Tiro Devanagari Hindi', 'Mukta', 'serif'],
        serif: ['Lora', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'lotus-bloom': 'lotus-bloom 0.6s ease-in-out forwards',
        'spin-slow': 'spin 20s linear infinite',
        'fade-in': 'fade-in 0.3s ease-in-out',
        'slide-up': 'slide-up 0.3s ease-in-out',
        breath: 'breath 4s ease-in-out infinite',
      },
      keyframes: {
        'lotus-bloom': {
          '0%': { transform: 'scale(0) rotate(-30deg)', opacity: '0' },
          '60%': { transform: 'scale(1.1) rotate(5deg)', opacity: '0.9' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        breath: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.05)', opacity: '0.9' },
        },
      },
    },
  },
  plugins: [],
}
