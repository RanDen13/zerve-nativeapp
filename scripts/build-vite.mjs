import { rm } from "node:fs/promises";
import { builtinModules } from "node:module";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { build } from "vite";

const root = process.cwd();
const rendererName = "main_window";
const external = [
  "electron",
  ...builtinModules,
  ...builtinModules.map((name) => `node:${name}`),
];
const define = {
  MAIN_WINDOW_VITE_DEV_SERVER_URL: "undefined",
  MAIN_WINDOW_VITE_NAME: JSON.stringify(rendererName),
};

async function buildMain() {
  await build({
    configFile: false,
    define,
    resolve: {
      alias: {
        "@": path.resolve(root, "src"),
      },
    },
    build: {
      outDir: path.resolve(root, ".vite", "build"),
      emptyOutDir: true,
      sourcemap: false,
      lib: {
        entry: path.resolve(root, "src", "main.ts"),
        formats: ["cjs"],
        fileName: () => "main.js",
      },
      rollupOptions: {
        external,
        output: {
          entryFileNames: "main.js",
        },
      },
    },
  });
}

async function buildPreload() {
  await build({
    configFile: false,
    define,
    build: {
      outDir: path.resolve(root, ".vite", "build"),
      emptyOutDir: false,
      sourcemap: false,
      lib: {
        entry: path.resolve(root, "src", "preload.ts"),
        formats: ["cjs"],
        fileName: () => "preload.js",
      },
      rollupOptions: {
        external,
        output: {
          entryFileNames: "preload.js",
        },
      },
    },
  });
}

async function buildRenderer() {
  await build({
    configFile: false,
    base: "./",
    plugins: [tailwindcss(), react()],
    resolve: {
      alias: {
        "@": path.resolve(root, "src"),
      },
      dedupe: ["react", "react-dom"],
    },
    build: {
      outDir: path.resolve(root, ".vite", "renderer", rendererName),
      emptyOutDir: true,
      sourcemap: false,
    },
  });
}

await rm(path.resolve(root, ".vite"), { force: true, recursive: true });
await Promise.all([buildMain(), buildPreload(), buildRenderer()]);
