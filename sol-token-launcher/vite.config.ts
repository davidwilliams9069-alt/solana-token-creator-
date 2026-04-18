import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// Optional Replit-specific plugins (only loaded when running inside Replit)
const replitPlugins: ReturnType<typeof defineConfig>["plugins"] = [];
if (process.env.REPL_ID) {
  // Dynamic import to avoid errors outside Replit environment
  try {
    const { default: runtimeErrorOverlay } = await import("@replit/vite-plugin-runtime-error-modal" as string);
    replitPlugins.push(runtimeErrorOverlay());
  } catch {}
  try {
    const { cartographer } = await import("@replit/vite-plugin-cartographer" as string);
    replitPlugins.push(cartographer({ root: path.resolve(import.meta.dirname, "..") }));
  } catch {}
  try {
    const { devBanner } = await import("@replit/vite-plugin-dev-banner" as string);
    replitPlugins.push(devBanner());
  } catch {}
}

// PORT and BASE_PATH: required inside Replit, optional for Vercel/other hosts
const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 3000;
const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true },
      protocolImports: true,
    }),
    react(),
    tailwindcss(),
    ...replitPlugins,
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    target: "esnext",
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
