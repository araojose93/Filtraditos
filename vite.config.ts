import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Config mínima: el plugin PWA queda listo (manifest + service worker)
// para cuando se porte la UI real desde legacy/brewlab-prototype.html.
// Mientras tanto, src/main.ts solo confirma que el engine corre en browser.
export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "BrewLab · V60",
        short_name: "BrewLab",
        description: "Coach de vertido para V60: cronómetro guiado, perfil de molino y bitácora de catas.",
        lang: "es",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "portrait",
        background_color: "#1a1410",
        theme_color: "#1a1410",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
