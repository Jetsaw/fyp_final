import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const avatarDir = path.resolve("public/avatar/ebee_new");
const docsDir = path.resolve("docs");
const outputDir = path.resolve("dist/ebee_ai4animation_handoff");

const requiredFiles = [
  ["model", path.join(avatarDir, "ebee_new.fbx"), "ebee_new.fbx"],
  ["rigMap", path.join(avatarDir, "ebee_rig_map.json"), "ebee_rig_map.json"],
  ["contract", path.join(avatarDir, "ebee_ai4animation_contract.json"), "ebee_ai4animation_contract.json"],
  ["schema", path.join(avatarDir, "ebee_ai4animation_export.schema.json"), "ebee_ai4animation_export.schema.json"],
  ["avatarManifest", path.join(avatarDir, "ebee_avatar_manifest.json"), "ebee_avatar_manifest.json"],
  ["handoffGuide", path.join(docsDir, "AVATAR_AI4ANIMATION_HANDOFF.md"), "AVATAR_AI4ANIMATION_HANDOFF.md"],
  [
    "unityExporter",
    path.resolve("tools/ai4animation/EbeeAI4AnimationJsonExporter.cs"),
    "tools/ai4animation/EbeeAI4AnimationJsonExporter.cs",
  ],
  [
    "unityExporterInstallScript",
    path.resolve("scripts/install-ai4animation-unity-exporter.mjs"),
    "scripts/install-ai4animation-unity-exporter.mjs",
  ],
  [
    "unityProjectPrepareScript",
    path.resolve("scripts/prepare-ai4animation-unity-project.mjs"),
    "scripts/prepare-ai4animation-unity-project.mjs",
  ],
  [
    "unityProjectPrepareVerifyScript",
    path.resolve("scripts/verify-ai4animation-unity-project-prep.mjs"),
    "scripts/verify-ai4animation-unity-project-prep.mjs",
  ],
  [
    "unityExporterInstallerVerifyScript",
    path.resolve("scripts/verify-ai4animation-unity-exporter-installer.mjs"),
    "scripts/verify-ai4animation-unity-exporter-installer.mjs",
  ],
  [
    "sourceAssetSyncScript",
    path.resolve("scripts/sync-ebee-source-assets.mjs"),
    "scripts/sync-ebee-source-assets.mjs",
  ],
  [
    "productionInstallScript",
    path.resolve("scripts/install-ai4animation-production-pipeline.mjs"),
    "scripts/install-ai4animation-production-pipeline.mjs",
  ],
  [
    "productionReadyScript",
    path.resolve("scripts/verify-ai4animation-production-ready.mjs"),
    "scripts/verify-ai4animation-production-ready.mjs",
  ],
  [
    "productionStatusScript",
    path.resolve("scripts/report-ai4animation-production-status.mjs"),
    "scripts/report-ai4animation-production-status.mjs",
  ],
  [
    "productionGuardScript",
    path.resolve("scripts/verify-ai4animation-production-guards.mjs"),
    "scripts/verify-ai4animation-production-guards.mjs",
  ],
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function hashFile(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function copyFileWithInfo(sourcePath, relativePath) {
  const targetPath = path.join(outputDir, relativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
  const stats = fs.statSync(targetPath);
  return {
    path: relativePath.replaceAll(path.sep, "/"),
    bytes: stats.size,
    sha256: hashFile(targetPath),
  };
}

function copyDirectoryWithInfo(sourceDir, relativeDir) {
  if (!fs.existsSync(sourceDir)) return [];

  const copied = [];
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      copied.push(...copyDirectoryWithInfo(sourcePath, relativePath));
    } else if (entry.isFile()) {
      copied.push(copyFileWithInfo(sourcePath, relativePath));
    }
  }
  return copied;
}

for (const [, sourcePath] of requiredFiles) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing required AI4Animation handoff file: ${sourcePath}`);
  }
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

const files = Object.fromEntries(
  requiredFiles.map(([key, sourcePath, relativePath]) => [key, copyFileWithInfo(sourcePath, relativePath)]),
);
const textures = copyDirectoryWithInfo(path.join(avatarDir, "sourceimages"), "sourceimages");

const rigMap = readJson(path.join(avatarDir, "ebee_rig_map.json"));
const contract = readJson(path.join(avatarDir, "ebee_ai4animation_contract.json"));
const avatarManifest = readJson(path.join(avatarDir, "ebee_avatar_manifest.json"));
const schema = readJson(path.join(avatarDir, "ebee_ai4animation_export.schema.json"));

const handoffManifest = {
  schema: "hive-ebee-ai4animation-handoff-package/v1",
  generatedBy: "scripts/export-ai4animation-handoff-package.mjs",
  source: "sebastianstarke/AI4Animation",
  avatar: {
    name: "Ebee",
    modelPath: files.model.path,
    textureDirectory: "sourceimages",
    textureCount: textures.length,
    exactRuntimeModel: true,
  },
  rig: {
    rigMapPath: files.rigMap.path,
    controllableNodeCount: rigMap.controllableNodeCount,
    visibleAvatarMeshCount: rigMap.visibleAvatarMeshCount,
    requiredNodePoseCoverage: rigMap.controllableNodeCount,
    jointGroups: Object.keys(rigMap.groups ?? {}).length,
  },
  ai4animation: {
    repository: "https://github.com/sebastianstarke/AI4Animation",
    contractPath: files.contract.path,
    exportJsonSchemaPath: files.schema.path,
    exportSchema: contract.ai4animationExportSchema?.schema,
    acceptedTopLevel: contract.ai4animationExportSchema?.acceptedTopLevel ?? [],
    acceptedNodePoseFields: contract.ai4animationExportSchema?.acceptedNodePoseFields ?? [],
    states: Object.keys(contract.states ?? {}),
    controls: Object.keys(contract.controls ?? {}),
    phaseChannels: Object.keys(contract.phaseChannels ?? {}),
    trajectorySampleTimes: contract.trajectory?.sampleTimes ?? [],
    productionMinimumFramesPerState: 12,
    productionMinimumNodePoseCoverage: Math.floor((rigMap.controllableNodeCount ?? 0) * 0.85),
  },
  runtimeInstall: {
    guidePath: files.handoffGuide.path,
    unityExporterPath: files.unityExporter.path,
    unityExporterInstallScriptPath: files.unityExporterInstallScript.path,
    unityProjectPrepareScriptPath: files.unityProjectPrepareScript.path,
    unityProjectPrepareVerifyScriptPath: files.unityProjectPrepareVerifyScript.path,
    unityExporterInstallerVerifyScriptPath: files.unityExporterInstallerVerifyScript.path,
    sourceAssetSyncScriptPath: files.sourceAssetSyncScript.path,
    productionInstallScriptPath: files.productionInstallScript.path,
    productionReadyScriptPath: files.productionReadyScript.path,
    productionStatusScriptPath: files.productionStatusScript.path,
    productionGuardScriptPath: files.productionGuardScript.path,
    avatarManifestPath: files.avatarManifest.path,
    fallbackMotionSource: avatarManifest.motionDatabase?.source,
    runtimeMotionDatabaseInstalled: avatarManifest.motionDatabase?.runtimeMotionDatabase === true,
    commands: [
      "npm run avatar:source:sync",
      "npm run avatar:ai4animation:unity-project:prepare -- <AI4Animation-Unity-project-dir>",
      "npm run avatar:ai4animation:unity-exporter:install -- <AI4Animation-Unity-project-dir>",
      "npm run avatar:ai4animation:status",
      "npm run avatar:ai4animation:production:install -- <raw-export-json>",
      "npm run avatar:ai4animation:production:ready",
      "npm run avatar:ai4animation:validate -- <raw-export-json>",
      "npm run avatar:ai4animation:import -- <raw-export-json> <runtime-json>",
      "npm run avatar:ai4animation:runtime:check -- <runtime-json>",
      "npm run avatar:ai4animation:promote -- <runtime-json> public/avatar/ebee_new/ebee_ai4animation_motion_database.json",
      "npm run avatar:ai4animation:install -- public/avatar/ebee_new/ebee_ai4animation_motion_database.json",
      "npm run avatar:pipeline",
    ],
  },
  files,
  textures,
  schemaInfo: {
    jsonSchema: schema.$schema,
    exportSchema: schema.properties?.schema?.const,
  },
};

fs.writeFileSync(path.join(outputDir, "handoff_manifest.json"), `${JSON.stringify(handoffManifest, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      status: "exported",
      outputDir,
      files: Object.keys(files).length,
      textures: textures.length,
      controllableNodeCount: handoffManifest.rig.controllableNodeCount,
      states: handoffManifest.ai4animation.states.length,
    },
    null,
    2,
  ),
);
