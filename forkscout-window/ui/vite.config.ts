import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
    plugins: [react()],
    base: "./",
    build: {
        outDir: "../sidepanel",
        emptyOutDir: true,
        // Inline small chunks — extensions don't benefit from code-splitting
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
            },
            output: {
                entryFileNames: "assets/[name].js",
                chunkFileNames: "assets/[name].js",
                assetFileNames: "assets/[name].[ext]",
            },
        },
    },
});
