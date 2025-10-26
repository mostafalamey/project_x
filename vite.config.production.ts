import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Production config for GitHub Pages deployment
// Use VITE_BASE_PATH env var to override base path (for local preview)
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/project_x/", // Default to GitHub Pages path
  plugins: [react()],
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          viewer: ["photo-sphere-viewer", "react-photo-sphere-viewer"],
          animation: ["framer-motion"],
          canvas: ["konva", "react-konva"],
        },
      },
    },
  },
  define: {
    // Exclude admin features in production
    "import.meta.env.VITE_INCLUDE_ADMIN": "false",
  },
});
