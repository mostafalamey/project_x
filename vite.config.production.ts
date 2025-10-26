import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Production config for GitHub Pages deployment
export default defineConfig({
  base: "/project_x/", // Base path for GitHub Pages (https://mostafalamey.github.io/project_x/)
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
