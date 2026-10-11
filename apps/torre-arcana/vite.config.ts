import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Served from https://<user>.github.io/dungeon-depths/torre-arcana/ on GitHub Pages.
  base: mode === "production" ? "/dungeon-depths/torre-arcana/" : "/",
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
