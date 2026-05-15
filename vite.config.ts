import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Plan catalog lives in backend — single source of truth.
      "@shared/plans": path.resolve(__dirname, "../../AVG_Token_Distrubution_Backend/src/lib/plans.ts"),
    },
  },
  server: {
    port: 5173,
    fs: {
      // Must include project root; a custom list replaces defaults and would block index.html.
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, "../../AVG_Token_Distrubution_Backend"),
      ],
    },
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
