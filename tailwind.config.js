/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-color': '#3b82f6', // blue-500
        'primary-light': '#93c5fd', // blue-300
        'primary-dark': '#1d4ed8', // blue-700
        'secondary-color': '#10b981', // emerald-500
        'secondary-light': '#6ee7b7', // emerald-300
        'secondary-dark': '#047857', // emerald-700
      },
      
    },
  },
  plugins: [],
};