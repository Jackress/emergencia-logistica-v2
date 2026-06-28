import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          supabase:  ["@supabase/supabase-js"],
          leaflet:   ["leaflet", "react-leaflet"],
        },
      },
    },
  },
  // Evita que Vite procese los assets de leaflet de forma incorrecta
  optimizeDeps: {
    include: ["leaflet", "react-leaflet"],
  },
});
