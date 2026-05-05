import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		port: 5173,
	},
	build: {
		cssCodeSplit: true,
		reportCompressedSize: false,
		chunkSizeWarningLimit: 600,
		minify: "esbuild",
		target: "es2020",
		// No manualChunks — Vite's default chunking already splits per
		// dynamic import boundary (each lazy route gets its own chunk and
		// pulls in only what it needs). Manually grouping vendor packages
		// (e.g. all of @tiptap/* into a single "tiptap" chunk) accidentally
		// drags transitive deps onto the home-page critical path because
		// Rollup can't undo a manual chunk decision when it discovers a
		// shared module. Letting Rollup decide keeps the entry chunk small.
	},
});
