import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import unfonts from "unplugin-fonts/vite"

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tsconfigPaths(),
    unfonts({
      fontsource: {
        families: ["Geist Sans", "Geist Mono"],
      },
    }),
  ],
})
