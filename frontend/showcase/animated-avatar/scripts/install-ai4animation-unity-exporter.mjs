import fs from "node:fs";
import path from "node:path";

const [projectArg] = process.argv.slice(2);

if (!projectArg) {
  throw new Error("Usage: node scripts/install-ai4animation-unity-exporter.mjs <AI4Animation-Unity-project-dir>");
}

const projectDir = path.resolve(projectArg);
const assetsDir = path.join(projectDir, "Assets");
const sourceExporterPath = path.resolve("tools/ai4animation/EbeeAI4AnimationJsonExporter.cs");
const targetExporterRelativePath = "Assets/Editor/EbeeAI4AnimationJsonExporter.cs";
const targetDir = path.join(assetsDir, "Editor");
const targetExporterPath = path.join(targetDir, "EbeeAI4AnimationJsonExporter.cs");

function assertFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${label}: ${filePath}`);
  }

  const stat = fs.statSync(filePath);
  if (!stat.isFile() || stat.size <= 0) {
    throw new Error(`${label} is empty or not a file: ${filePath}`);
  }
}

function findScript(scriptName) {
  const searchRoot = path.join(assetsDir, "Scripts");
  const matches = [];
  const stack = [searchRoot];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || !fs.existsSync(current)) {
      continue;
    }

    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
      } else if (entry.isFile() && entry.name === scriptName) {
        matches.push(entryPath);
      }
    }
  }

  if (matches.length === 0) {
    throw new Error(`Missing AI4Animation ${scriptName} under ${searchRoot}`);
  }

  matches.sort((a, b) => a.length - b.length || a.localeCompare(b));
  return matches[0];
}

assertFile(sourceExporterPath, "local Ebee Unity exporter");
const motionEditorPath = findScript("MotionEditor.cs");
const motionDataPath = findScript("MotionData.cs");
const actorPath = findScript("Actor.cs");
assertFile(motionEditorPath, "AI4Animation MotionEditor.cs");
assertFile(motionDataPath, "AI4Animation MotionData.cs");
assertFile(actorPath, "AI4Animation Actor.cs");

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(sourceExporterPath, targetExporterPath);

const installed = fs.readFileSync(targetExporterPath, "utf8");
const requiredText = [
  "AI4Animation/Exporter/Ebee JSON Runtime Exporter",
  "ai4animation-motion-export/v1",
  "minimumNodePoseCoverage",
  "EnumerateTransforms(actor.GetRoot())",
];

const missing = requiredText.filter((text) => !installed.includes(text));
if (missing.length > 0) {
  throw new Error(`Installed exporter is missing required text: ${missing.join(", ")}`);
}

console.log(
  JSON.stringify(
    {
      status: "installed",
      projectDir,
      targetExporterRelativePath,
      targetExporterPath,
      verifiedAgainst: [
        path.relative(projectDir, motionEditorPath).replaceAll(path.sep, "/"),
        path.relative(projectDir, motionDataPath).replaceAll(path.sep, "/"),
        path.relative(projectDir, actorPath).replaceAll(path.sep, "/"),
      ],
    },
    null,
    2,
  ),
);
