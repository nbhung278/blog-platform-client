import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// The CSP meta tag in index.html is production-tuned (api.strix-blog.uk,
// cdn.strix-blog.uk, S3, Google avatars). In dev the SPA talks to
// http://localhost:3000 which would otherwise be blocked by connect-src,
// and dev images may come from the local minio bucket on a different host.
// Strip the meta CSP during `vite dev` so the dev server isn't crippled;
// the meta still ships verbatim in `vite build` output for prod.
function stripCspInDev(): Plugin {
	return {
		name: "strip-csp-in-dev",
		apply: "serve",
		transformIndexHtml: {
			order: "pre",
			handler(html) {
				return html.replace(
					/<meta\s+http-equiv="Content-Security-Policy"[^>]*\/?>/i,
					"<!-- CSP meta tag stripped by vite-dev plugin; production build retains it -->",
				);
			},
		},
	};
}

export default defineConfig({
	plugins: [react(), tailwindcss(), stripCspInDev()],
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
