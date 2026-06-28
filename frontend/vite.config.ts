import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  assetsInclude: ["**/*.glb", "**/*.gltf"],
  server: {
    proxy: {
      "/ask": "http://127.0.0.1:8000",
      "/health": "http://127.0.0.1:8000",
      "/api": "http://127.0.0.1:8000",
    },
  },
  preview: {
    proxy: {
      "/ask": "http://127.0.0.1:8000",
      "/health": "http://127.0.0.1:8000",
      "/api": "http://127.0.0.1:8000",
    },
  },
});
