import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import type { Plugin } from "vite";

const svgMock: Plugin = {
  name: "svg-mock",
  enforce: "pre",
  load(id) {
    if (id.endsWith(".svg")) {
      return 'export default "svg-mock"';
    }
  },
};

export default defineConfig({
  plugins: [svgMock, react()],
  resolve: {
    alias: {
      "@/assets": path.resolve(__dirname, "src/assets"),
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    exclude: ["node_modules", ".next", "dist"],
    globals: true,
  },
});
