import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative assets keep production builds portable across nested paths.
  base: "./",
  plugins: [react()],
});
