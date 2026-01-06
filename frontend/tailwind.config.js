/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 啟用 class 模式的深色主題
  theme: {
    extend: {
      colors: {
        // Maple theme colors (Canadian inspired)
        maple: {
          50: '#fef7f0',
          100: '#fdecd8',
          200: '#fad5b0',
          300: '#f7b87d',
          400: '#f39248',
          500: '#ef7424',
          600: '#e05a1a',
          700: '#ba4317',
          800: '#94361a',
          900: '#782f18',
          950: '#41150a',
        },
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
