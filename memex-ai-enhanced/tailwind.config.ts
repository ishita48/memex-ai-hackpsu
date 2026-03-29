import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#09090b", raised: "#0f0f12" },
        surface: { DEFAULT: "#141419", hover: "#1a1a21" },
        border: { DEFAULT: "#1e1e26", subtle: "#16161d" },
        accent: { DEFAULT: "#6d5cff", hover: "#7d6eff", muted: "rgba(109,92,255,0.12)" },
        severity: {
          critical: "#f43f5e",
          high: "#f59e0b",
          medium: "#eab308",
          low: "#10b981",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "slide-up": "slideUp 0.4s ease both",
        "slide-down": "slideDown 0.35s ease both",
        "fade-in": "fadeIn 0.3s ease both",
        "scale-in": "scaleIn 0.3s ease both",
        "pulse-dot": "pulse-dot 2s ease infinite",
        glow: "glow 3s ease infinite",
      },
    },
  },
  plugins: [],
};
export default config;
