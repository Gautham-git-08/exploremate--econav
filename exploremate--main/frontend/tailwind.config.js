/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mustard: {
          DEFAULT: '#EAA82C',
          50: '#FDF8ED',
          100: '#FBF0D5',
          200: '#F7DFAB',
          300: '#F2CE80',
          400: '#EEBE56',
          500: '#EAA82C',
          600: '#C88B16',
          700: '#956810',
          800: '#63450B',
          900: '#322305',
        },
        teal: {
          DEFAULT: '#0E7490',
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
        },
        leaf: {
          DEFAULT: '#16A34A',
          500: '#16A34A',
          600: '#15803D',
        },
        sand: {
          DEFAULT: '#FBF8F3',
          100: '#F4EEE1',
          200: '#E8DCBF',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      }
    },
  },
  plugins: [],
}
