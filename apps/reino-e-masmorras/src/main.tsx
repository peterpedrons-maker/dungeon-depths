import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Registers the no-op service worker in public/sw.js — required for Chrome
// (Android/desktop) to consider this page installable as a PWA at all, even
// though it does zero caching on purpose (see sw.js's own comment for why).
// BASE_URL resolves to "/" in dev and "/dungeon-depths/reino-e-masmorras/"
// in production, matching vite.config.ts's own base.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}
