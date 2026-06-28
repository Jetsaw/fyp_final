import fs from "node:fs";
import path from "node:path";
import { MOTION_CLIPS } from "../src/components/ebeeRigController.ts";

const avatarDir = path.resolve("public/avatar/ebee_new");
const manifestPath = path.join(avatarDir, "ebee_avatar_manifest.json");
const rigMapPath = path.join(avatarDir, "ebee_rig_map.json");
const productionDatabaseName = "ebee_ai4animation_motion_database.json";
const productionDatabasePath = path.join(avatarDir, productionDatabaseName);

function readJsonIfPresent(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function requirement(name, passed, details) {
  return {
    name,
    status: passed ? "passed" : "missing",
    details,
  };
}

const manifest = readJsonIfPresent(manifestPath);
const rigMap = readJsonIfPresent(rigMapPath);
const database = readJsonIfPresent(productionDatabasePath);
const states = Object.keys(MOTION_CLIPS);
const rigNodeCount = rigMap?.controllableNodeCount ?? 0;
const minFramesPerState = 12;
const minNodePoseCoverage = Math.floor(rigNodeCount * 0.85);
const frameCounts = Object.fromEntries(
  states.map((state) => [state, database?.frames?.filter((frame) => frame.state === state).length ?? 0]),
);
const nodePoseCoverage = database?.frames?.length
  ? Math.min(...database.frames.map((frame) => Object.keys(frame.nodePose ?? {}).length))
  : 0;

const requirements = [
  requirement(
    "avatar-manifest",
    manifest?.schema === "hive-ebee-avatar-package/v1",
    manifest ? `schema=${manifest.schema}` : "public/avatar/ebee_new/ebee_avatar_manifest.json missing",
  ),
  requirement(
    "rig-map-750-nodes",
    rigNodeCount === 750,
    `controllableNodeCount=${rigNodeCount}`,
  ),
  requirement(
    "manifest-selects-production-database",
    manifest?.motionDatabase?.path === productionDatabaseName,
    `manifest.motionDatabase.path=${manifest?.motionDatabase?.path ?? "none"}`,
  ),
  requirement(
    "manifest-runtime-motion",
    manifest?.motionDatabase?.runtimeMotionDatabase === true,
    `runtimeMotionDatabase=${manifest?.motionDatabase?.runtimeMotionDatabase ?? false}`,
  ),
  requirement(
    "manifest-ai4animation-source-schema",
    manifest?.motionDatabase?.sourceSchema === "ai4animation-motion-export/v1",
    `sourceSchema=${manifest?.motionDatabase?.sourceSchema ?? "none"}`,
  ),
  requirement(
    "production-database-file",
    database?.schema === "hive-ebee-motion-database/v1",
    database ? `schema=${database.schema}` : `${productionDatabaseName} missing`,
  ),
  requirement(
    "production-database-not-fallback",
    Boolean(database) && database?.source !== "procedural-ai4animation-adapter",
    `source=${database?.source ?? "none"}`,
  ),
  requirement(
    "production-database-installed",
    database?.installedBy === "scripts/install-ai4animation-motion.mjs",
    `installedBy=${database?.installedBy ?? "none"}`,
  ),
  requirement(
    "production-database-not-sample",
    Boolean(database) && database?.promotion?.sampleOnly !== true,
    `sampleOnly=${database?.promotion?.sampleOnly ?? false}`,
  ),
  requirement(
    "production-frames-per-state",
    states.every((state) => frameCounts[state] >= minFramesPerState),
    `minimum=${minFramesPerState}; counts=${JSON.stringify(frameCounts)}`,
  ),
  requirement(
    "production-nodepose-coverage",
    Boolean(database) && nodePoseCoverage >= minNodePoseCoverage,
    `minimum=${minNodePoseCoverage}; lowestFrameNodePose=${nodePoseCoverage}`,
  ),
];

const ready = requirements.every((entry) => entry.status === "passed");

console.log(
  JSON.stringify(
    {
      status: ready ? "ready" : "not-ready",
      summary: ready
        ? "Production AI4Animation runtime data is installed and selected."
        : "Production AI4Animation runtime data is not installed yet.",
      nextCommand: ready
        ? "npm run avatar:ai4animation:production:ready"
        : "npm run avatar:ai4animation:production:install -- <raw-ai4animation-export-json>",
      manifestPath,
      productionDatabasePath,
      requirements,
    },
    null,
    2,
  ),
);
