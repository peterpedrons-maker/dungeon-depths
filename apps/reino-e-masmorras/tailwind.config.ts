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
        nightsky: "#171009",
        panel: "#2b2013",
        panel2: "#3d2f1c",
        panelborder: "#7a5a34",
        wood: "#4a3520",
        woodlight: "#a9834f",
      },
      fontFamily: {
        serif: ["'EB Garamond'", "Georgia", "'Times New Roman'", "serif"],
        display: ["Cinzel", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
