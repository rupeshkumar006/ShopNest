import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    port: 8080,
    strictPort: false,
    cors: true,
    proxy: {
      '/backend': {
        target: 'http://localhost/shopnest',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/backend/, '/backend')
      }
    }
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
