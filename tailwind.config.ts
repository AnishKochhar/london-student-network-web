import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        "shiny-text": {
          "0%, 90%, 100%": {
            "background-position": "calc(-100% - var(--shiny-width)) 0",
          },
          "30%, 60%": {
            "background-position": "calc(100% + var(--shiny-width)) 0",
          },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite linear',
        glow: 'glow 2s infinite linear',
        "shiny-text": "shiny-text 4s infinite",
      },
      backgroundImage: {
        'gradient-shimmer': 'linear-gradient(90deg, #ccc 25%, #e0e0e0 50%, #ccc 75%)',
        'glowing-spot': 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.1) 60%, rgba(255,255,255,0) 70%)',
      },
    },
  },
  plugins: [],
};
export default config;
