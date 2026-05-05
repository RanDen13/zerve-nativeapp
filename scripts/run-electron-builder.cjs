const { spawnSync } = require("node:child_process");
const path = require("node:path");

const root = process.cwd();
const builderBin = path.resolve(
  root,
  "node_modules",
  "electron-builder",
  "cli.js",
);
const stageDir = path.resolve(root, ".builder", "app");
const configPath = path.resolve(root, "electron-builder.yml");
const env = { ...process.env };

delete env.npm_config_user_agent;
delete env.npm_execpath;
delete env.npm_node_execpath;

const result = spawnSync(process.execPath, [builderBin, "--config", configPath, ...process.argv.slice(2)], {
  cwd: stageDir,
  env,
  stdio: "inherit",
  shell: false,
});

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);
