import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const nodeBin = process.execPath;
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const assetTarget = path.join(root, "android", "app", "src", "main", "assets", "www");

function run(command, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: {
        ...process.env,
        ...extraEnv,
      },
      stdio: "inherit",
      shell: false,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`));
    });
  });
}

async function main() {
  await run(nodeBin, ["scripts/generate-snapshots.mjs"]);
  await run(nodeBin, [nextBin, "build"], {
    NEXT_PUBLIC_BASE_PATH: "/app",
  });

  await fs.rm(assetTarget, { force: true, recursive: true });
  await fs.mkdir(path.dirname(assetTarget), { recursive: true });
  await fs.cp(path.join(root, "out"), assetTarget, { recursive: true });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
