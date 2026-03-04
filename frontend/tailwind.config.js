/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary, #1E40AF)',
          secondary: 'var(--brand-secondary, #3B82F6)',
          light: 'var(--brand-light, #DBEAFE)',
        },
      },
    },
  },
  plugins: [],
};
