import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Served from https://<user>.github.io/dungeon-depths/reino-e-masmorras/ on GitHub Pages.
  base: mode === "production" ? "/dungeon-depths/reino-e-masmorras/" : "/",
  server: {
    host: "::",
    port: 8081,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
