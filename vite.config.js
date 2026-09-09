import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Sources live in src/ (src/index.html is the dev entry).
// The production build is emitted to the repository root so that
// index.html + assets/ can be served directly as a static site.
export default defineConfig({
  root: "src",
  base: "./",
  plugins: [react()],
  build: {
    outDir: "..",
    emptyOutDir: false,
    assetsDir: "assets"
  }
});
