import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../../shared"),
    },
  },
  server: {
    port: 5173,
    fs: {
      // Must include project root; a custom list replaces defaults and would block index.html.
      allow: [path.resolve(__dirname), path.resolve(__dirname, "../../shared")],
    },
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
