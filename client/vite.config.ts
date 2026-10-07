import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon-32.png", "apple-touch-icon.png", "icon-192.png", "farmer.jpg"],
      manifest: {
        name: "Farm Expert",
        short_name: "Farm Expert",
        description: "Farm Expert — offline-first agricultural AI for Kenyan smallholder farmers",
        theme_color: "#2f6f3e",
        background_color: "#f7f3ea",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      // API responses are deliberately not cached here: a service-worker cache
      // hit looks like a live response to the app, which would label stale
      // prices as live. The app caches API data itself, with timestamps.
      workbox: {
        // Include icons/images/manifest so the installable PWA works offline on Render.
        globPatterns: ["**/*.{js,css,html,svg,ico,png,jpg,jpeg,webp,webmanifest}"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/health$/]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true
      }
    }
  }
});
