import fs from "node:fs";
import {
  JOINT_CONTROLS,
  MOTION_CLIPS,
  normalizeMotionDatabase,
  queryMotionDatabaseBlend,
  sampleMotionFrame,
} from "../src/components/ebeeRigController.ts";

const [databaseArg = "dist/ebee_ai4animation_motion_sample.json"] = process.argv.slice(2);
const databasePath = new URL(`../${databaseArg}`, import.meta.url);

if (!fs.existsSync(databasePath)) {
  throw new Error("Missing imported AI4Animation motion database. Run npm run avatar:ai4animation:import:check first.");
}

const data = JSON.parse(fs.readFileSync(databasePath, "utf8"));
const normalized = normalizeMotionDatabase(data);
const states = Object.keys(MOTION_CLIPS);
const jointSet = new Set(JOINT_CONTROLS);

function assertPose(name, pose) {
  for (const [joint, target] of Object.entries(pose)) {
    if (!jointSet.has(joint)) {
      throw new Error(`${name} references unknown joint ${joint}`);
    }

    if (!Array.isArray(target) || target.length !== 3 || target.some((value) => !Number.isFinite(value))) {
      throw new Error(`${name}.${joint} must be a finite XYZ tuple`);
    }
  }
}

function assertTrajectory(name, trajectory) {
  if (!Array.isArray(trajectory) || trajectory.length < 5) {
    throw new Error(`${name} needs at least five trajectory samples`);
  }

  for (const [index, sample] of trajectory.entries()) {
    if (!Number.isFinite(sample.time)) {
      throw new Error(`${name}[${index}].time must be finite`);
    }

    for (const field of ["position", "direction"]) {
      const tuple = sample[field];
      if (!Array.isArray(tuple) || tuple.length !== 2 || tuple.some((value) => !Number.isFinite(value))) {
        throw new Error(`${name}[${index}].${field} must be a finite XZ tuple`);
      }
    }
  }
}

function assertNodePose(name, nodePose) {
  if (!nodePose || Object.keys(nodePose).length === 0) {
    throw new Error(`${name} needs exact rig-node pose data`);
  }

  for (const [nodePath, target] of Object.entries(nodePose)) {
    if (!Array.isArray(target) || target.length !== 3 || target.some((value) => !Number.isFinite(value))) {
      throw new Error(`${name}.${nodePath} must be a finite XYZ tuple`);
    }
  }
}

if (data.schema !== "hive-ebee-motion-database/v1") {
  throw new Error(`Unexpected imported database schema ${data.schema}`);
}

if (data.sourceSchema !== "ai4animation-motion-export/v1") {
  throw new Error(`Unexpected imported source schema ${data.sourceSchema}`);
}

if (normalized.length !== data.frames.length) {
  throw new Error(`Runtime normalized ${normalized.length} frames from ${data.frames.length} imported AI4Animation frames`);
}

const stateResults = {};

for (const state of states) {
  const intent = data.intents[state];
  const match = queryMotionDatabaseBlend(
    {
      t: 0.2,
      pointerX: 0.08,
      pointerY: -0.04,
      state,
      transition: 1,
      intent,
    },
    normalized,
    3,
  );

  if (!Array.isArray(match.candidates) || match.candidates.length < 3) {
    throw new Error(`AI4Animation runtime query for ${state} returned too few candidates`);
  }

  if (match.candidates[0].frame.state !== state) {
    throw new Error(`AI4Animation runtime query for ${state} matched ${match.candidates[0].frame.state}`);
  }

  if (match.candidates.some((candidate) => !Number.isFinite(candidate.score) || !Number.isFinite(candidate.weight))) {
    throw new Error(`AI4Animation runtime query for ${state} produced invalid scores or weights`);
  }

  assertPose(`ai4animation-match:${state}`, match.pose);
  assertTrajectory(`ai4animation-feature:${state}`, match.feature.trajectory);
  assertTrajectory(`ai4animation-frame:${state}`, match.candidates[0].frame.feature.trajectory);
  assertNodePose(`ai4animation-frame-node-pose:${state}`, match.candidates[0].frame.nodePose);
  assertNodePose(`ai4animation-match-node-pose:${state}`, match.nodePose);

  const sample = sampleMotionFrame(
    {
      t: 0.2,
      pointerX: 0.08,
      pointerY: -0.04,
      state,
      transition: 1,
      intent,
      databaseWeight: 1,
    },
    normalized,
  );
  assertPose(`ai4animation-sample:${state}`, sample.pose);
  assertNodePose(`ai4animation-sample-node-pose:${state}`, sample.nodePose);

  stateResults[state] = {
    bestFrame: match.candidates[0].frame.id,
    candidates: match.candidates.length,
    bestScore: Number(match.candidates[0].score.toFixed(3)),
    totalWeight: Number(match.candidates.reduce((sum, candidate) => sum + candidate.weight, 0).toFixed(3)),
    trajectorySamples: match.candidates[0].frame.feature.trajectory.length,
    nodePoseCount: Object.keys(match.candidates[0].frame.nodePose ?? {}).length,
  };
}

console.log(
  JSON.stringify(
    {
      schema: data.schema,
      sourceSchema: data.sourceSchema,
      frameCount: data.frames.length,
      normalizedFrameCount: normalized.length,
      stateResults,
    },
    null,
    2,
  ),
);
