// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy para evitar CORS en desarrollo: /api/* -> http://127.0.0.1:8000/api/*
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
        // no rewrite necesario si el backend usa /api/ rutas
        // rewrite: (path) => path.replace(/^\/api/, "/api")
      },
    },
  },
});

