// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy simple para desarrollo: enruta /api -> backend en 127.0.0.1:8000 (evita CORS)
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
        ws: false,
      },
    },
  },
});

