import fs from "node:fs";

const guidePath = "docs/AVATAR_AI4ANIMATION_HANDOFF.md";
const packagePath = "package.json";

const guide = fs.readFileSync(guidePath, "utf8");
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const scripts = packageJson.scripts ?? {};

const requiredScripts = [
  "avatar:rig:export",
  "avatar:ai4animation:contract:export",
  "avatar:ai4animation:schema:export",
  "avatar:ai4animation:validate",
  "avatar:ai4animation:import",
  "avatar:ai4animation:runtime:check",
  "avatar:ai4animation:promote",
  "avatar:ai4animation:install",
  "avatar:ai4animation:production:install",
  "avatar:ai4animation:handoff:export",
  "avatar:ai4animation:handoff:package:verify",
  "avatar:ai4animation:unity-project:prepare",
  "avatar:ai4animation:unity-project:prepare:verify",
  "avatar:ai4animation:unity-exporter:install",
  "avatar:ai4animation:unity-exporter:install:verify",
  "avatar:ai4animation:unity-exporter:verify",
  "avatar:ai4animation:status",
  "avatar:ai4animation:production:ready",
  "avatar:manifest:export",
  "avatar:pipeline",
];

const requiredGuideText = [
  "public/avatar/ebee_new/ebee_rig_map.json",
  "public/avatar/ebee_new/ebee_ai4animation_contract.json",
  "public/avatar/ebee_new/ebee_ai4animation_export.schema.json",
  "public/avatar/ebee_new/ebee_avatar_manifest.json",
  "ai4animation-motion-export/v1",
  "procedural-ai4animation-adapter",
  "feature.trajectory",
  "trajectory samples",
  "nodePose",
  "750 controllable node paths",
  "--allow-sample",
  "12 frames per state",
  "runtimeMotionDatabase",
  "dist/ebee_ai4animation_handoff",
  "sourceimages",
  "handoff_manifest.json",
  "EbeeAI4AnimationJsonExporter.cs",
  "AI4Animation/Exporter/Ebee JSON Runtime Exporter",
  "https://github.com/sebastianstarke/AI4Animation.git",
  "Assets/Scripts/Animation/MotionEditor.cs",
  "Assets/Editor/EbeeAI4AnimationJsonExporter.cs",
  "ebee_ai4animation_motion_database.json",
  "production:ready",
  "avatar:ai4animation:status",
  "production:install",
];

const failures = [];

for (const scriptName of requiredScripts) {
  if (!scripts[scriptName]) {
    failures.push(`package.json is missing script ${scriptName}`);
  }

  if (!guide.includes(`npm run ${scriptName}`)) {
    failures.push(`${guidePath} does not mention npm run ${scriptName}`);
  }
}

for (const text of requiredGuideText) {
  if (!guide.includes(text)) {
    failures.push(`${guidePath} does not mention ${text}`);
  }
}

if (failures.length > 0) {
  console.error(
    JSON.stringify(
      {
        status: "failed",
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
      guidePath,
      scriptsChecked: requiredScripts.length,
      guideTermsChecked: requiredGuideText.length,
    },
    null,
    2,
  ),
);
