import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

import { cloudflare } from "@cloudflare/vite-plugin";

// Static, no-backend PWA. Data updates rarely, so it caches beautifully.
export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: "autoUpdate",
    includeAssets: ["favicon.svg", "icons/icon-192.png", "icons/icon-512.png"],
    manifest: {
      name: "UK Wealth Inequality",
      short_name: "UK Wealth",
      description:
        "How much wealth is there in the UK, and who owns it? Built from published ONS and WID data.",
      theme_color: "#0b1020",
      background_color: "#0b1020",
      display: "standalone",
      start_url: "/",
      icons: [
        { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
        {
          src: "icons/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
  }), cloudflare()],
});