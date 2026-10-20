import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0b0618",
        panel: "#180f2e",
        panelborder: "#3d2a5c",
        neon1: "#2ee6ff",
        neon2: "#ff2d95",
        neon3: "#8b5cf6",
        gold: "#ffb84d",
        danger: "#ff4d4d",
      },
    },
  },
  plugins: [],
} satisfies Config;
