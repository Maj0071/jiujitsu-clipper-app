/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        'bjj-red': '#cc0000',
        'bjj-red-dark': '#a30000',
        'bjj-blue': '#0066cc',
        'bjj-blue-dark': '#004d99',
        // Grayscale
        'bjj-gray-light': '#f8f9fa',
        'bjj-gray': '#e9ecef',
        'bjj-gray-dark': '#adb5bd',
        // Semantic colors
        'bjj-success': '#10b981',
        'bjj-warning': '#f59e0b',
        'bjj-error': '#ef4444'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace']
      },
      boxShadow: {
        'bjj-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'bjj': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'bjj-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'bjj-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/line-clamp')
  ],
}