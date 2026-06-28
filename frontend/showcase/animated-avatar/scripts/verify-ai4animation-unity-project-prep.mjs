import fs from "node:fs";

const prepPath = "scripts/prepare-ai4animation-unity-project.mjs";
const source = fs.readFileSync(prepPath, "utf8");

const requiredText = [
  "https://github.com/sebastianstarke/AI4Animation.git",
  "git",
  "clone",
  "--depth",
  "fetch",
  "install-ai4animation-unity-exporter.mjs",
  "Assets",
  "Editor",
  "EbeeAI4AnimationJsonExporter.cs",
  "avatar:ai4animation:production:install",
];

const failures = requiredText
  .filter((text) => !source.includes(text))
  .map((text) => `${prepPath} does not contain ${text}`);

if (failures.length > 0) {
  console.error(
    JSON.stringify(
      {
        status: "failed",
        prepPath,
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
      prepPath,
      checks: requiredText.length,
    },
    null,
    2,
  ),
);
