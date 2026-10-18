import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#07060d",
        panel: "#15121f",
        panelborder: "#3a3350",
        neon1: "#2fe6ff",
        neon2: "#ff3fb0",
        neon3: "#ffd23f",
        metal: "#d8e4ff",
        combo: "#39ff88",
      },
    },
  },
  plugins: [],
} satisfies Config;
