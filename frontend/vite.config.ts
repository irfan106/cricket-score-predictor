import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      api: fileURLToPath(new URL("./src/api", import.meta.url)),
      components: fileURLToPath(new URL("./src/components", import.meta.url)),
      lib: fileURLToPath(new URL("./src/lib", import.meta.url)),
      pages: fileURLToPath(new URL("./src/pages", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
