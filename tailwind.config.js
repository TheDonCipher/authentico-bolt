/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui'],
        serif: ['Playfair Display', 'serif'],
        inter: ['var(--font-inter)', 'system-ui'],
        playfair: ['Playfair Display', 'serif'],
        archivo: ['var(--font-archivo)', 'system-ui'],
      },
    },
  },
  plugins: [],
};
