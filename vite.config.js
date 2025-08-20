import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Your frontend port
    proxy: {
      // 🔥 PROXY CONFIGURATION - This will fix your API calls!
      "/api": {
        target: "http://localhost:5001", // Your backend port
        changeOrigin: true,
        secure: false,
      },
    },
  },
});