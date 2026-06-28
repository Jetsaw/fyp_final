import fs from "node:fs";
import path from "node:path";
import {
  MOTION_CLIPS,
  normalizeMotionDatabase,
  sampleMotionFrame,
} from "../src/components/ebeeRigController.ts";

const avatarDir = path.resolve("public/avatar/ebee_new");
const manifestPath = path.join(avatarDir, "ebee_avatar_manifest.json");
const rigMapPath = path.join(avatarDir, "ebee_rig_map.json");
const failures = [];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fail(message) {
  failures.push(message);
}

if (!fs.existsSync(manifestPath)) {
  fail("Missing avatar manifest. Run npm run avatar:manifest:export.");
}

if (!fs.existsSync(rigMapPath)) {
  fail("Missing rig map. Run npm run avatar:rig:export.");
}

let manifest = null;
let rigMap = null;
let database = null;

if (fs.existsSync(manifestPath)) {
  manifest = readJson(manifestPath);
  if (manifest.schema !== "hive-ebee-avatar-package/v1") {
    fail(`Unexpected manifest schema ${manifest.schema}`);
  }

  const motionPath = manifest.motionDatabase?.path;
  if (motionPath !== "ebee_ai4animation_motion_database.json") {
    fail(`Runtime manifest must point at ebee_ai4animation_motion_database.json, found ${motionPath}`);
  }

  if (manifest.motionDatabase?.sourceSchema !== "ai4animation-motion-export/v1") {
    fail(`Runtime motion sourceSchema must be ai4animation-motion-export/v1, found ${manifest.motionDatabase?.sourceSchema}`);
  }

  if (manifest.motionDatabase?.runtimeMotionDatabase !== true) {
    fail("Runtime motion database metadata is not marked true.");
  }

  if (manifest.motionDatabase?.preferredRuntimeDatabase !== true) {
    fail("Manifest did not select the AI4Animation runtime database as preferred.");
  }

  const databasePath = motionPath ? path.join(avatarDir, motionPath) : null;
  if (!databasePath || !fs.existsSync(databasePath)) {
    fail(`Missing runtime AI4Animation database file: ${motionPath}`);
  } else {
    database = readJson(databasePath);
  }
}

if (fs.existsSync(rigMapPath)) {
  rigMap = readJson(rigMapPath);
  if (rigMap.controllableNodeCount !== 750) {
    fail(`Rig map must expose 750 controllable nodes, found ${rigMap.controllableNodeCount}`);
  }
}

if (database && rigMap) {
  const states = Object.keys(MOTION_CLIPS);
  const nodePathSet = new Set(Object.values(rigMap.groups ?? {}).flatMap((nodes) => nodes.map((node) => node.path)));
  const minFramesPerState = 12;
  const minNodePoseCoverage = Math.floor(nodePathSet.size * 0.85);
  const normalized = normalizeMotionDatabase(database);

  if (database.schema !== "hive-ebee-motion-database/v1") {
    fail(`Unexpected runtime database schema ${database.schema}`);
  }

  if (database.sourceSchema !== "ai4animation-motion-export/v1") {
    fail(`Runtime database sourceSchema must be ai4animation-motion-export/v1, found ${database.sourceSchema}`);
  }

  if (database.source === "procedural-ai4animation-adapter") {
    fail("Runtime database is still procedural fallback, not trained AI4Animation motion.");
  }

  if (database.installedBy !== "scripts/install-ai4animation-motion.mjs") {
    fail("Runtime database was not installed through scripts/install-ai4animation-motion.mjs.");
  }

  if (database.promotion?.sampleOnly) {
    fail("Runtime database is marked sampleOnly.");
  }

  if (normalized.length !== database.frames?.length) {
    fail(`Runtime normalized ${normalized.length} frames from ${database.frames?.length ?? 0} database frames.`);
  }

  for (const state of states) {
    const frames = database.frames?.filter((frame) => frame.state === state) ?? [];
    if (frames.length < minFramesPerState) {
      fail(`${state} needs at least ${minFramesPerState} production frames, found ${frames.length}.`);
    }

    for (const frame of frames) {
      const nodePoseCount = Object.keys(frame.nodePose ?? {}).length;
      if (nodePoseCount < minNodePoseCoverage) {
        fail(`${frame.id} needs at least ${minNodePoseCoverage} nodePose entries, found ${nodePoseCount}.`);
        break;
      }
    }

    const sample = sampleMotionFrame(
      {
        t: 0.55,
        pointerX: 0.04,
        pointerY: -0.03,
        state,
        transition: 1,
        intent: database.intents?.[state],
        databaseWeight: 1,
      },
      normalized,
    );

    const sampleNodePoseCount = Object.keys(sample.nodePose ?? {}).length;
    if (sampleNodePoseCount < minNodePoseCoverage) {
      fail(`${state} runtime sample needs at least ${minNodePoseCoverage} nodePose entries, found ${sampleNodePoseCount}.`);
    }
  }
}

if (failures.length > 0) {
  console.error(
    JSON.stringify(
      {
        status: "not-ready",
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
      status: "ready",
      motionDatabase: manifest.motionDatabase.path,
      sourceSchema: manifest.motionDatabase.sourceSchema,
      runtimeMotionDatabase: manifest.motionDatabase.runtimeMotionDatabase,
      controllableNodeCount: rigMap.controllableNodeCount,
    },
    null,
    2,
  ),
);
