/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'chuwue-primary': '#FF6B35',
        'chuwue-dark': '#004E89',
        'chuwue-light': '#F7F7F7',
      },
      spacing: {
        'safe-area-top': 'env(safe-area-inset-top)',
        'safe-area-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
}
