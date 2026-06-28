import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const [rawExportArg] = process.argv.slice(2);

if (!rawExportArg) {
  throw new Error("Usage: node scripts/install-ai4animation-production-pipeline.mjs <raw-ai4animation-export-json>");
}

const rawExportPath = path.resolve(rawExportArg);
if (!fs.existsSync(rawExportPath)) {
  throw new Error(`Missing raw AI4Animation export JSON: ${rawExportPath}`);
}

const workDir = path.resolve("artifacts/ai4animation_production_install");
const importedPath = path.join(workDir, "ebee_ai4animation_imported.json");
const promotedPath = path.join(workDir, "ebee_ai4animation_promoted.json");
const installedPath = path.resolve("public/avatar/ebee_new/ebee_ai4animation_motion_database.json");

fs.mkdirSync(workDir, { recursive: true });

function runStep(name, command, args) {
  const quietOutput = name === "avatarPipeline";
  const shellCommand = process.platform === "win32" && command.toLowerCase().endsWith("npm.cmd");
  const actualCommand = shellCommand ? "cmd.exe" : command;
  const actualArgs = shellCommand ? ["/d", "/s", "/c", ["npm", ...args].join(" ")] : args;
  const options = {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 512 * 1024 * 1024,
    stdio: "pipe",
  };
  const result = spawnSync(actualCommand, actualArgs, options);

  if (!quietOutput && result.stdout) process.stdout.write(result.stdout);
  if (!quietOutput && result.stderr) process.stderr.write(result.stderr);
  if (result.error) process.stderr.write(`${result.error.message}\n`);

  if (result.status !== 0) {
    if (quietOutput) {
      const combined = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.split(/\r?\n/).slice(-160).join("\n");
      process.stderr.write(`${combined}\n`);
    }
    console.error(
      JSON.stringify(
        {
          status: "failed",
          failedStep: name,
          command: actualCommand,
          args: actualArgs,
        },
        null,
        2,
      ),
    );
    process.exit(result.status ?? 1);
  }
}

const node = process.execPath;
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const steps = [
  ["sourceAssetSync", node, ["scripts/sync-ebee-source-assets.mjs"]],
  ["rigExport", node, ["scripts/export-ebee-rig-map.mjs"]],
  ["contractExport", node, ["scripts/export-ai4animation-contract.mjs"]],
  ["schemaExport", node, ["scripts/export-ai4animation-json-schema.mjs"]],
  ["validateRawExport", node, ["scripts/validate-ai4animation-export.mjs", rawExportPath]],
  ["importRuntimeDatabase", node, ["scripts/import-ai4animation-motion.mjs", rawExportPath, importedPath]],
  ["runtimeCheckImported", node, ["scripts/verify-ai4animation-runtime.mjs", path.relative(process.cwd(), importedPath)]],
  ["promoteProductionDatabase", node, ["scripts/promote-ai4animation-motion.mjs", importedPath, promotedPath]],
  ["installProductionDatabase", node, ["scripts/install-ai4animation-motion.mjs", promotedPath, installedPath]],
  ["manifestExport", node, ["scripts/export-ebee-avatar-manifest.mjs"]],
  ["manifestVerify", node, ["scripts/verify-ebee-avatar-manifest.mjs"]],
  ["productionReady", node, ["scripts/verify-ai4animation-production-ready.mjs"]],
  ["avatarPipeline", npm, ["run", "avatar:pipeline"]],
  ["productionReadyAfterPipeline", node, ["scripts/verify-ai4animation-production-ready.mjs"]],
];

for (const [name, command, args] of steps) {
  runStep(name, command, args);
}

console.log(
  JSON.stringify(
    {
      status: "installed",
      rawExportPath,
      importedPath,
      promotedPath,
      installedPath,
      finalGate: "avatar:ai4animation:production:ready",
    },
    null,
    2,
  ),
);
