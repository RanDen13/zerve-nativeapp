# Zerve Kiosk Build Guide

This project is configured to build on both Windows and Xubuntu.

## Prerequisites

- Node.js 20+
- pnpm 10+
- Project dependencies installed:

```bash
pnpm install
```

## Build On Windows

Create Windows installer artifacts (Squirrel):

```bash
pnpm run make:win
```

Output is generated under `out/make`.

## Build On Xubuntu

Install Linux packaging tools first:

```bash
sudo apt update
sudo apt install -y rpm fakeroot dpkg-dev build-essential
```

Build both `.deb` and `.rpm` packages:

```bash
pnpm run make:linux
```

Or build each target separately:

```bash
pnpm run make:linux:deb
pnpm run make:linux:rpm
```

Output is generated under `out/make`.

## Notes

- Cross-building Windows installers from Linux (or Linux packages from Windows) is not part of this setup.
- Recommended workflow:
  - Build Windows artifacts on Windows.
  - Build Linux artifacts on Xubuntu.
