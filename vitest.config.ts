import { config } from "dotenv";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

config({ path: ".env.local" });

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    include: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
