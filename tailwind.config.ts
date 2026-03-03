import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/hooks/**/*.{ts,tsx}",
    "./src/store/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--color-ink-rgb) / <alpha-value>)",
        mist: "rgb(var(--color-mist-rgb) / <alpha-value>)",
        parchment: "rgb(var(--color-parchment-rgb) / <alpha-value>)",
        ember: "rgb(var(--color-ember-rgb) / <alpha-value>)",
        royal: "rgb(var(--color-royal-rgb) / <alpha-value>)",
        gild: "rgb(var(--color-gild-rgb) / <alpha-value>)",
        slate: "rgb(var(--color-slate-rgb) / <alpha-value>)"
      },
      fontFamily: {
        display: "var(--font-display)",
        body: "var(--font-body)"
      },
      boxShadow: {
        panel: "0 18px 50px rgba(7, 12, 28, 0.42)"
      },
      backgroundImage: {
        "page-glow":
          "radial-gradient(circle at top, rgba(196,167,103,0.18), transparent 38%), radial-gradient(circle at bottom, rgba(89,124,201,0.18), transparent 30%)"
      }
    }
  },
  plugins: []
};

export default config;
