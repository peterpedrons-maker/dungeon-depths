import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0a0a0c",
        panel: "#17171b",
        panelborder: "#33333a",
        steel1: "#e4e6ea",
        steel2: "#9aa0ab",
        steel3: "#4b4f58",
        gold: "#c9a86a",
        danger: "#9a5a52",
        metal: "#d8e4ff",
      },
    },
  },
  plugins: [],
} satisfies Config;
