// vite.config.js
// Configuração do Vite (o programa que roda meu React).
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Tudo que começa com /api o Vite manda para o meu backend em Python.
    // Assim eu não preciso escrever http://localhost:5000 em todo lugar.
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});
