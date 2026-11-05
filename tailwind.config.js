/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy token name retained so existing components share the green brand palette.
        wine: {
          50: '#f1f6f2',
          100: '#e0ebe2',
          200: '#c4d8c9',
          300: '#9bbba5',
          400: '#70977e',
          500: '#4f795f',
          600: '#3b614a',
          700: '#2e4e3c',
          800: '#254032',
          900: '#1f3529',
          950: '#14271e',
        },
        gold: {
          50: '#faf8f0',
          100: '#f3efdc',
          200: '#e7dcba',
          300: '#d7c28f',
          400: '#c5a059',
          500: '#b28945',
          600: '#986e36',
          700: '#7a522c',
          800: '#644229',
          900: '#533725',
          950: '#2d1c12',
        },
        creme: {
          50: '#faf9f6',
          100: '#f5f2eb',
          200: '#eae3d5',
          300: '#dcd1bd',
          400: '#cbba9f',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
