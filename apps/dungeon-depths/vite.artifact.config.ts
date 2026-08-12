import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// One-off build config used only to produce a single self-contained HTML
// build for sharing as a standalone artifact. Not used by normal dev/build.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist-artifact",
    assetsInlineLimit: 10_000_000,
    cssCodeSplit: false,
  },
});
