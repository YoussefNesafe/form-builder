import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: [
      "form-builder/**/*.test.{ts,tsx}",
      "components/**/*.test.{ts,tsx}",
      "app/**/*.test.{ts,tsx}",
      "lib/**/*.test.{ts,tsx}",
      "locales/**/*.test.{ts,tsx}",
      "scripts/**/*.test.{ts,tsx,mjs}",
    ],
    passWithNoTests: true,
  },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
