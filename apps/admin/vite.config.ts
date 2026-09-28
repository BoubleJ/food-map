import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), react(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 3001,
    proxy: {
      "/api": { target: "http://localhost:4000", changeOrigin: true },
    },
  },
  build: {
    outDir: "dist",
  },
});
