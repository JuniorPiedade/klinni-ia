/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        'ice-gray': '#F4F7F6',
        'soft-blue': '#7FA9D1',
        'deep-blue': '#9BB8CD',
        'clinic-white': '#FFFFFF'
      },
      borderRadius: {
        'clinic': '16px',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      }
    }
  },
  plugins: [],
}
