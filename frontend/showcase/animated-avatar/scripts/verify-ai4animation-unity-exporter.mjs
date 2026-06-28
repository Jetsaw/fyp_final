import fs from "node:fs";

const exporterPath = "tools/ai4animation/EbeeAI4AnimationJsonExporter.cs";
const source = fs.readFileSync(exporterPath, "utf8");

const requiredText = [
  "AI4Animation/Exporter/Ebee JSON Runtime Exporter",
  "MotionEditor",
  "MotionData",
  "Actor",
  "editor.LoadFrame(timestamp)",
  "EnumerateTransforms(actor.GetRoot())",
  "Stack<Transform>",
  "minimumNodePoseCoverage",
  "ResolveContractPath",
  "UniqueSuffixToPath",
  "AmbiguousSuffixes",
  "nodePoseCount < minimumNodePoseCoverage",
  "ai4animation-motion-export/v1",
  "nodePose",
  "trajectory",
  "localPhases",
  "GetContractPath",
  "ToSignedRadians",
];

const failures = requiredText
  .filter((text) => !source.includes(text))
  .map((text) => `${exporterPath} does not contain ${text}`);

if (failures.length > 0) {
  console.error(
    JSON.stringify(
      {
        status: "failed",
        exporterPath,
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
      exporterPath,
      checks: requiredText.length,
    },
    null,
    2,
  ),
);
