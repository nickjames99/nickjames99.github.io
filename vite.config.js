import { defineConfig } from "vite";

function githubPagesBase() {
  if (process.env.BASE_PATH) return process.env.BASE_PATH;

  const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
  const isUserSite = repository.endsWith(".github.io");

  if (process.env.GITHUB_ACTIONS === "true" && repository && !isUserSite) {
    return `/${repository}/`;
  }

  return "/";
}

export default defineConfig({
  base: githubPagesBase(),
  build: {
    target: "es2020",
    sourcemap: false,
    minify: "esbuild",
    cssMinify: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        entryFileNames: "assets/app-[hash].js",
        chunkFileNames: "assets/chunk-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  }
});
