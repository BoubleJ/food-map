import babel from "@rolldown/plugin-babel";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  envDir: "../..",
  plugins: [tailwindcss(), reactRouter(), babel({ presets: [reactCompilerPreset()] })],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 3000,
    proxy: {
      "/api": { target: "http://localhost:4000", changeOrigin: true },
    },
  },
});
