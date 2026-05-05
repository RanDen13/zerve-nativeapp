const { spawnSync } = require("node:child_process");

const root = process.cwd();
const targets = process.argv.slice(2);
const dockerArgs = [
  "run",
  "--rm",
  "--env",
  "ELECTRON_CACHE=/root/.cache/electron",
  "--env",
  "ELECTRON_BUILDER_CACHE=/root/.cache/electron-builder",
  "--volume",
  `${root}:/project`,
  "--volume",
  "zerve-electron-builder-node-modules:/project/node_modules",
  "--volume",
  "zerve-electron-cache:/root/.cache/electron",
  "--volume",
  "zerve-electron-builder-cache:/root/.cache/electron-builder",
  "--workdir",
  "/project",
  "electronuserland/builder:wine",
  "bash",
  "-lc",
  [
    "corepack enable",
    "corepack prepare pnpm@10.12.4 --activate",
    "pnpm install --frozen-lockfile",
    "pnpm run build",
    `node scripts/run-electron-builder.cjs --linux ${targets.join(" ")}`.trim(),
  ].join(" && "),
];

const result = spawnSync("docker", dockerArgs, {
  cwd: root,
  stdio: "inherit",
  shell: false,
});

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);
