import fs from "node:fs";

const installerPath = "scripts/install-ai4animation-unity-exporter.mjs";
const source = fs.readFileSync(installerPath, "utf8");

const requiredText = [
  "MotionEditor.cs",
  "MotionData.cs",
  "Actor.cs",
  "Assets",
  "Editor",
  "EbeeAI4AnimationJsonExporter.cs",
  "AI4Animation/Exporter/Ebee JSON Runtime Exporter",
  "ai4animation-motion-export/v1",
  "minimumNodePoseCoverage",
  "EnumerateTransforms(actor.GetRoot())",
];

const failures = requiredText
  .filter((text) => !source.includes(text))
  .map((text) => `${installerPath} does not contain ${text}`);

if (failures.length > 0) {
  console.error(
    JSON.stringify(
      {
        status: "failed",
        installerPath,
        failures,
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      status: "passed",
      installerPath,
      checks: requiredText.length,
    },
    null,
    2,
  ),
);
