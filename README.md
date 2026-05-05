# Zerve Kiosk Build Guide

This project uses Vite for app bundling and Electron Builder for packaging.

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker Desktop, only for Linux `.deb` / `.AppImage` builds from Windows
- Project dependencies installed:

```bash
pnpm install
```

## Build On Windows

Create the Windows installer:

```bash
pnpm run make:win
```

Create an unpacked Windows build for a quick package check:

```bash
pnpm run package
```

Output is generated under `out/`.

## Build Linux From Windows

Start Docker Desktop first, then run:

```bash
pnpm run make:linux
```

Or build each Linux target separately:

```bash
pnpm run make:linux:deb
pnpm run make:linux:appimage
pnpm run make:linux:rpm
```

The Linux commands run Electron Builder inside the `electronuserland/builder:wine` Docker image, so you do not need to set up WSL manually.

Output is generated under `out/`.

## Notes

- `pnpm run build` creates the `.vite` bundle and stages a minimal runtime app in `.builder/app`.
- Electron Builder packages from `.builder/app`, which avoids pnpm workspace path issues on Windows.
