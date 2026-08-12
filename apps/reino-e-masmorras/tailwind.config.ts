import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        parchment: "#e8dcc0",
        ink: "#2a2018",
        gold: "#c89a2e",
        crimson: "#8a2030",
        nightsky: "#0a0814",
        panel: "#1c1530",
        panel2: "#251c3d",
        panelborder: "#4a3a70",
      },
      fontFamily: {
        serif: ["'EB Garamond'", "Georgia", "'Times New Roman'", "serif"],
        display: ["Cinzel", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
