/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        blueprint: {
          DEFAULT: '#0047AB',
          50: '#E6F0FF',
          100: '#CCE0FF',
          200: '#99C2FF',
          600: '#003D94',
          700: '#00337A',
          800: '#002960',
          900: '#001F47',
        },
        safety: {
          DEFAULT: '#FF5F00',
          50: '#FFF3E6',
          100: '#FFE7CC',
          500: '#FF5F00',
          600: '#E65500',
        },
        surface: '#FFFFFF',
        background: '#F8FAFC',
        border: '#E2E8F0',
      },
      fontFamily: {
        heading: ['Chivo', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
      // backgroundImage: {
      //   // Commented out to disable background images for debugging
      // },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
