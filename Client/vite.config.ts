import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  // [THÊM MỚI] Cấu hình Proxy để nối React với Python
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000", // Chuyển tiếp các request /api sang Python
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
