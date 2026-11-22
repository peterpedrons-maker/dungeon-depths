import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  // Servido em https://<user>.github.io/dungeon-depths/masmorra-do-dado/ no GitHub Pages.
  base: mode === "production" ? "/dungeon-depths/masmorra-do-dado/" : "/",
  server: { port: 8083 },
  plugins: [react()],
}));
