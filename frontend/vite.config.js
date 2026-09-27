import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Mantém o endereço local alinhado ao callback cadastrado no Spotify.
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      // Toda requisição que começar com /api será redirecionada para o backend
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
