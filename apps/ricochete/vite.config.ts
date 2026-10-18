import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Served from https://<user>.github.io/dungeon-depths/ricochete/ on GitHub Pages.
  base: mode === "production" ? "/dungeon-depths/ricochete/" : "/",
  server: {
    host: "::",
    port: 8082,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
