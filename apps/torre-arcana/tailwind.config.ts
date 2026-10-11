import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0a0714",
        ink: "#120d1f",
        panel: "#1b1430",
        panelborder: "#4a3a7a",
        arcane: "#7c5cff",
        arcane2: "#38bdf8",
        ember: "#ff7a45",
        gold: "#e8c868",
      },
    },
  },
  plugins: [],
} satisfies Config;
