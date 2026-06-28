import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const outputDir = path.resolve("dist/ebee_ai4animation_handoff");
const manifestPath = path.join(outputDir, "handoff_manifest.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function hashFile(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function assertFile(record, label) {
  assert(record?.path, `${label} missing path`);
  if (!record?.path) return;

  const filePath = path.join(outputDir, record.path);
  assert(fs.existsSync(filePath), `${label} file is missing: ${record.path}`);
  if (!fs.existsSync(filePath)) return;

  const stats = fs.statSync(filePath);
  assert(stats.size === record.bytes, `${label} byte count mismatch for ${record.path}`);
  assert(hashFile(filePath) === record.sha256, `${label} sha256 mismatch for ${record.path}`);
}

const failures = [];

assert(fs.existsSync(manifestPath), "Missing dist/ebee_ai4animation_handoff/handoff_manifest.json");

if (fs.existsSync(manifestPath)) {
  const manifest = readJson(manifestPath);
  assert(manifest.schema === "hive-ebee-ai4animation-handoff-package/v1", "Unexpected handoff package schema");
  assert(manifest.avatar?.modelPath === "ebee_new.fbx", "Handoff package does not reference ebee_new.fbx");
  assert(manifest.avatar?.exactRuntimeModel === true, "Handoff package must mark the runtime model as exact");
  assert(manifest.avatar?.textureCount >= 10, "Handoff package should include Ebee source textures");
  assert(manifest.rig?.controllableNodeCount === 750, "Handoff package must expose all 750 controllable nodes");
  assert(manifest.rig?.requiredNodePoseCoverage === 750, "Handoff package must require exact nodePose coverage");
  assert(manifest.ai4animation?.exportSchema === "ai4animation-motion-export/v1", "Unexpected AI4Animation export schema");
  assert(manifest.ai4animation?.productionMinimumFramesPerState === 12, "Production frame minimum must stay documented");
  assert(manifest.ai4animation?.productionMinimumNodePoseCoverage >= 637, "Production nodePose coverage gate is too low");
  assert((manifest.ai4animation?.states ?? []).length >= 5, "Expected at least five avatar motion states");
  assert((manifest.ai4animation?.controls ?? []).includes("gesture"), "Gesture control missing from handoff controls");
  assert((manifest.ai4animation?.acceptedNodePoseFields ?? []).includes("nodePose"), "nodePose export field missing");
  assert(manifest.runtimeInstall?.unityExporterPath === "tools/ai4animation/EbeeAI4AnimationJsonExporter.cs", "Unity exporter missing from handoff manifest");
  assert(
    manifest.runtimeInstall?.unityExporterInstallScriptPath === "scripts/install-ai4animation-unity-exporter.mjs",
    "Unity exporter installer missing from handoff manifest",
  );
  assert(
    manifest.runtimeInstall?.unityProjectPrepareScriptPath === "scripts/prepare-ai4animation-unity-project.mjs",
    "Unity project prepare script missing from handoff manifest",
  );
  assert(
    manifest.runtimeInstall?.unityProjectPrepareVerifyScriptPath === "scripts/verify-ai4animation-unity-project-prep.mjs",
    "Unity project prepare verifier missing from handoff manifest",
  );
  assert(
    manifest.runtimeInstall?.unityExporterInstallerVerifyScriptPath === "scripts/verify-ai4animation-unity-exporter-installer.mjs",
    "Unity exporter installer verifier missing from handoff manifest",
  );
  assert(manifest.runtimeInstall?.sourceAssetSyncScriptPath === "scripts/sync-ebee-source-assets.mjs", "Source sync script missing from handoff manifest");
  assert(
    manifest.runtimeInstall?.productionInstallScriptPath === "scripts/install-ai4animation-production-pipeline.mjs",
    "Production install script missing from handoff manifest",
  );
  assert(
    manifest.runtimeInstall?.productionReadyScriptPath === "scripts/verify-ai4animation-production-ready.mjs",
    "Production-ready script missing from handoff manifest",
  );
  assert(
    manifest.runtimeInstall?.productionStatusScriptPath === "scripts/report-ai4animation-production-status.mjs",
    "Production status script missing from handoff manifest",
  );
  assert(
    manifest.runtimeInstall?.productionGuardScriptPath === "scripts/verify-ai4animation-production-guards.mjs",
    "Production guard script missing from handoff manifest",
  );
  assert((manifest.runtimeInstall?.commands ?? []).some((command) => command.includes("avatar:source:sync")), "Source sync command missing");
  assert(
    (manifest.runtimeInstall?.commands ?? []).some((command) => command.includes("avatar:ai4animation:unity-exporter:install")),
    "Unity exporter install command missing",
  );
  assert(
    (manifest.runtimeInstall?.commands ?? []).some((command) => command.includes("avatar:ai4animation:unity-project:prepare")),
    "Unity project prepare command missing",
  );
  assert(
    (manifest.runtimeInstall?.commands ?? []).some((command) => command.includes("avatar:ai4animation:production:install")),
    "One-command production install command missing",
  );
  assert(
    (manifest.runtimeInstall?.commands ?? []).some((command) => command.includes("avatar:ai4animation:production:ready")),
    "Production-ready command missing",
  );
  assert(
    (manifest.runtimeInstall?.commands ?? []).some((command) => command.includes("avatar:ai4animation:status")),
    "Production status command missing",
  );
  assert((manifest.runtimeInstall?.commands ?? []).some((command) => command.includes("avatar:ai4animation:install")), "Install command missing");

  for (const [label, record] of Object.entries(manifest.files ?? {})) {
    assertFile(record, label);
  }

  for (const texture of manifest.textures ?? []) {
    assertFile(texture, `texture ${texture.path}`);
  }

  const rigMap = readJson(path.join(outputDir, manifest.files?.rigMap?.path ?? ""));
  const contract = readJson(path.join(outputDir, manifest.files?.contract?.path ?? ""));
  const avatarManifest = readJson(path.join(outputDir, manifest.files?.avatarManifest?.path ?? ""));
  const schema = readJson(path.join(outputDir, manifest.files?.schema?.path ?? ""));
  const unityExporter = fs.readFileSync(path.join(outputDir, manifest.files?.unityExporter?.path ?? ""), "utf8");
  const unityExporterInstallScript = fs.readFileSync(path.join(outputDir, manifest.files?.unityExporterInstallScript?.path ?? ""), "utf8");
  const unityProjectPrepareScript = fs.readFileSync(path.join(outputDir, manifest.files?.unityProjectPrepareScript?.path ?? ""), "utf8");
  const unityProjectPrepareVerifyScript = fs.readFileSync(
    path.join(outputDir, manifest.files?.unityProjectPrepareVerifyScript?.path ?? ""),
    "utf8",
  );
  const unityExporterInstallerVerifyScript = fs.readFileSync(
    path.join(outputDir, manifest.files?.unityExporterInstallerVerifyScript?.path ?? ""),
    "utf8",
  );
  const sourceAssetSyncScript = fs.readFileSync(path.join(outputDir, manifest.files?.sourceAssetSyncScript?.path ?? ""), "utf8");
  const productionInstallScript = fs.readFileSync(path.join(outputDir, manifest.files?.productionInstallScript?.path ?? ""), "utf8");
  const productionReadyScript = fs.readFileSync(path.join(outputDir, manifest.files?.productionReadyScript?.path ?? ""), "utf8");
  const productionStatusScript = fs.readFileSync(path.join(outputDir, manifest.files?.productionStatusScript?.path ?? ""), "utf8");
  const productionGuardScript = fs.readFileSync(path.join(outputDir, manifest.files?.productionGuardScript?.path ?? ""), "utf8");

  assert(rigMap.schema === "hive-ebee-rig-map/v1", "Bundled rig map schema mismatch");
  assert(rigMap.controllableNodeCount === manifest.rig?.controllableNodeCount, "Bundled rig node count does not match handoff manifest");
  assert(contract.schema === "hive-ebee-ai4animation-contract/v1", "Bundled AI4Animation contract schema mismatch");
  assert(contract.runtimeModel?.controllableNodeCount === manifest.rig?.controllableNodeCount, "Contract controllable node count mismatch");
  assert(avatarManifest.schema === "hive-ebee-avatar-package/v1", "Bundled avatar manifest schema mismatch");
  assert(schema.properties?.schema?.const === "ai4animation-motion-export/v1", "Bundled JSON schema export const mismatch");
  assert(unityExporter.includes("AI4Animation/Exporter/Ebee JSON Runtime Exporter"), "Bundled Unity exporter menu item missing");
  assert(unityExporter.includes("ai4animation-motion-export/v1"), "Bundled Unity exporter schema missing");
  assert(unityExporterInstallScript.includes("MotionEditor.cs"), "Bundled Unity exporter installer does not verify MotionEditor.cs");
  assert(unityExporterInstallScript.includes("Assets/Editor"), "Bundled Unity exporter installer does not install under Assets/Editor");
  assert(
    unityProjectPrepareScript.includes("https://github.com/sebastianstarke/AI4Animation.git"),
    "Bundled Unity project prepare script does not reference upstream AI4Animation",
  );
  assert(unityProjectPrepareScript.includes("install-ai4animation-unity-exporter.mjs"), "Bundled Unity project prepare script does not install exporter");
  assert(
    unityProjectPrepareVerifyScript.includes("prepare-ai4animation-unity-project.mjs"),
    "Bundled Unity project prepare verifier does not check the prepare script",
  );
  assert(
    unityExporterInstallerVerifyScript.includes("install-ai4animation-unity-exporter.mjs"),
    "Bundled Unity exporter installer verifier does not check the installer",
  );
  assert(sourceAssetSyncScript.includes("Ebee_Model_rig_New.mb"), "Bundled source sync script does not verify Maya source rig");
  assert(productionInstallScript.includes("sourceAssetSync"), "Bundled production installer does not sync source assets");
  assert(productionInstallScript.includes("verify-ai4animation-production-ready.mjs"), "Bundled production installer does not run production-ready verification");
  assert(productionReadyScript.includes("procedural-ai4animation-adapter"), "Bundled production-ready script does not reject fallback runtime");
  assert(productionStatusScript.includes("Production AI4Animation runtime data is not installed yet"), "Bundled production status script does not report not-ready state");
  assert(productionGuardScript.includes("production-installer-rejects-sample-export"), "Bundled production guard does not test one-command installer rejection");
}

if (failures.length > 0) {
  console.error(
    JSON.stringify(
      {
        status: "failed",
        outputDir,
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
      outputDir,
      manifestPath,
    },
    null,
    2,
  ),
);
