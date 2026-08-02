/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "../backend/dist/ui",
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
  },
  define: {
    __VUE_PROD_DEVTOOLS__: mode !== "production",
  },
  base: "./",
  publicDir: "src/assets",
  test: {
    environment: "jsdom",
    include: ["src/**/__tests__/**/*.{test,spec}.ts"],
  },
}));
