import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative assets work on user/project GitHub Pages URLs and on Vercel.
  base: "./",
  plugins: [react()],
});
