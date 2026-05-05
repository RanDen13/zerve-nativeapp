import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const stageDir = path.resolve(root, ".builder", "app");
const packageJson = JSON.parse(
  await readFile(path.resolve(root, "package.json"), "utf8"),
);

const runtimePackageJson = {
  name: packageJson.name,
  productName: packageJson.productName,
  version: packageJson.version,
  description: packageJson.description,
  homepage: packageJson.homepage,
  main: packageJson.main,
  author: packageJson.author,
  license: packageJson.license,
  dependencies: {},
};

await rm(stageDir, { force: true, recursive: true });
await mkdir(stageDir, { recursive: true });
await cp(path.resolve(root, ".vite"), path.resolve(stageDir, ".vite"), {
  recursive: true,
});
await cp(path.resolve(root, "assets"), path.resolve(stageDir, "assets"), {
  recursive: true,
});
await writeFile(
  path.resolve(stageDir, "package.json"),
  `${JSON.stringify(runtimePackageJson, null, 2)}\n`,
);
