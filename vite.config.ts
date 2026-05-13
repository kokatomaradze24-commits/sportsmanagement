// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Target modern browsers to skip legacy polyfills/transforms (regenerator, Object.is, etc.)
// and reduce bundle size — addresses Lighthouse "Legacy JavaScript" audit.
export default defineConfig({
  vite: {
    build: {
      target: "es2020",
    },
  },
});
