import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const [targetArg] = process.argv.slice(2);
const targetDir = path.resolve(targetArg ?? "dist/AI4Animation");
const repoUrl = "https://github.com/sebastianstarke/AI4Animation.git";
const installerScript = path.resolve("scripts/install-ai4animation-unity-exporter.mjs");

function runStep(name, command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: "pipe",
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    throw new Error(`${name} failed: ${result.stderr || result.stdout}`);
  }
}

function assertDirectory(filePath, label) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isDirectory()) {
    throw new Error(`Missing ${label}: ${filePath}`);
  }
}

if (fs.existsSync(targetDir)) {
  assertDirectory(path.join(targetDir, ".git"), "AI4Animation git checkout");
  runStep("git-fetch-ai4animation", "git", [
    "-C",
    targetDir,
    "fetch",
    "--depth",
    "1",
    "--filter=blob:none",
    "origin",
  ]);
} else {
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  runStep("git-clone-ai4animation", "git", [
    "clone",
    "--depth",
    "1",
    "--filter=blob:none",
    "--single-branch",
    repoUrl,
    targetDir,
  ]);
}

runStep("install-ebee-unity-exporter", process.execPath, [installerScript, targetDir]);

console.log(
  JSON.stringify(
    {
      status: "prepared",
      repository: repoUrl,
      targetDir,
      exporterPath: path.join(targetDir, "Assets", "Editor", "EbeeAI4AnimationJsonExporter.cs"),
      nextSteps: [
        "Open the prepared AI4Animation Unity project in Unity.",
        "Use AI4Animation/Exporter/Ebee JSON Runtime Exporter.",
        "Run npm run avatar:ai4animation:production:install -- <raw-export-json> after exporting JSON.",
      ],
    },
    null,
    2,
  ),
);
