import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Le proxy redirige toutes les requêtes /api vers le backend Python (port 8000).
// Le frontend appelle donc "/api/..." sans se soucier du CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
