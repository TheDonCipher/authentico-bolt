import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        inter: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        archivo: ['var(--font-archivo)', 'system-ui', 'sans-serif'],
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

        // Extended Palette for UI Enhancements
        'deep-forest': '#1B5E20', // Darker variant of forest-green for hover states
        'light-sage': '#E8F5E9', // Lighter variant of soft-sage for subtle backgrounds
        'warm-ivory': '#FFF8E1', // Warmer variant of ivory for highlighted content
        'deep-sienna': '#BF360C', // Deeper variant of burnt-sienna for critical errors
        'golden-yellow': '#FFD600', // Brighter variant of sunflower for important highlights
        'mint-green': '#B9F6CA', // Fresh mint color for new/unread items
        'lavender-blue': '#B39DDB', // Subtle purple for tertiary elements
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
