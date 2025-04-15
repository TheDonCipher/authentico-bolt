import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      fontFamily: {
        sans: ['Archivo', 'sans-serif'],
      },
      colors: {
        // Primary Colors (Earth & Trust)
        'forest-green': '#2E7D32', // Rich, grounded tone representing reliability and growth
        'deep-moss': '#1B4332', // Dark green/olive for header bars or nav backgrounds
        'soft-sage': '#DDE5D5', // Light green for backgrounds or subtle elements

        // Secondary & Background Colors (Natural Neutrals)
        ivory: '#FAF9F6', // Soft, paper-like background for readability
        'stone-gray': '#CED4DA', // Borders, cards, and passive UI elements
        'clay-brown': '#8D6E63', // Optional earthy accent for secondary buttons or footers

        // Accent Colors (Signals & Feedback)
        sunflower: '#FBC02D', // Friendly warning or highlight tone
        'sap-green': '#66BB6A', // Use for "Verified" or success confirmations
        'burnt-sienna': '#D84315', // For "error" states with a natural, muted feel
        'sky-blue': '#81D4FA', // Calming secondary highlight (optional for CTAs or links)
      },
    },
  },
  plugins: [],
};
export default config;
