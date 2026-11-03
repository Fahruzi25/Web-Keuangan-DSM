/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        num: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // hijau army (dominan)
        army: {
          50: '#f3f6ef',
          100: '#e4ebdb',
          200: '#c9d7b9',
          300: '#a6bc8c',
          400: '#7f9d62',
          500: '#5f7f45',
          600: '#4a6436',
          700: '#3b502d',
          800: '#2c3d24',
          900: '#1c2a1b',
          950: '#101a11',
        },
        // aksen oranye gelap
        ember: {
          300: '#f0a35e',
          400: '#e5833a',
          500: '#d1691f',
          600: '#b45517',
          700: '#8f4313',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,26,17,.06), 0 8px 24px -12px rgba(16,26,17,.18)',
        glass: '0 10px 30px -10px rgba(0,0,0,.45)',
      },
      borderRadius: { '4xl': '2rem' },
    },
  },
  plugins: [],
};
