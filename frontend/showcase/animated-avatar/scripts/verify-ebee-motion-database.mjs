import fs from "node:fs";
import {
  JOINT_CONTROLS,
  MOTION_DATABASE,
  MOTION_CLIPS,
  normalizeMotionDatabase,
  queryMotionDatabase,
  sampleMotionClip,
  sampleMotionFrame,
} from "../src/components/ebeeRigController.ts";

const databasePath = new URL("../public/avatar/ebee_new/ebee_motion_database.json", import.meta.url);
const rigMapPath = new URL("../public/avatar/ebee_new/ebee_rig_map.json", import.meta.url);

if (!fs.existsSync(databasePath)) {
  throw new Error("Missing exported Ebee motion database. Run npm run avatar:motion:export.");
}

const data = JSON.parse(fs.readFileSync(databasePath, "utf8"));
const rigMap = JSON.parse(fs.readFileSync(rigMapPath, "utf8"));
const normalized = normalizeMotionDatabase(data);
const states = Object.keys(MOTION_CLIPS);
const jointSet = new Set(JOINT_CONTROLS);
const nodePathSet = new Set(Object.values(rigMap.groups ?? {}).flatMap((nodes) => nodes.map((node) => node.path)));

function assertPose(frameId, pose) {
  for (const [joint, target] of Object.entries(pose)) {
    if (!jointSet.has(joint)) {
      throw new Error(`frame ${frameId} references unknown joint ${joint}`);
    }

    if (!Array.isArray(target) || target.length !== 3 || target.some((value) => !Number.isFinite(value))) {
      throw new Error(`frame ${frameId}.${joint} must be a finite XYZ tuple`);
    }
  }
}

function assertNodePose(frameId, nodePose) {
  if (!nodePose || typeof nodePose !== "object") {
    throw new Error(`frame ${frameId} is missing exact nodePose data`);
  }

  const nodePaths = Object.keys(nodePose);
  if (nodePaths.length !== nodePathSet.size) {
    throw new Error(`frame ${frameId} nodePose count mismatch: ${nodePaths.length} !== ${nodePathSet.size}`);
  }

  for (const [nodePath, target] of Object.entries(nodePose)) {
    if (!nodePathSet.has(nodePath)) {
      throw new Error(`frame ${frameId} references unknown node path ${nodePath}`);
    }

    if (!Array.isArray(target) || target.length !== 3 || target.some((value) => !Number.isFinite(value))) {
      throw new Error(`frame ${frameId}.${nodePath} must be a finite XYZ tuple`);
    }
  }
}

function nodePoseDistance(a, b) {
  let sum = 0;

  for (const nodePath of nodePathSet) {
    const av = a[nodePath] ?? [0, 0, 0];
    const bv = b[nodePath] ?? [0, 0, 0];
    sum += Math.hypot(av[0] - bv[0], av[1] - bv[1], av[2] - bv[2]);
  }

  return sum;
}

if (data.schema !== "hive-ebee-motion-database/v1") {
  throw new Error(`Unexpected motion database schema ${data.schema}`);
}

if (!Array.isArray(data.frames) || data.frames.length !== MOTION_DATABASE.length) {
  throw new Error(`Expected ${MOTION_DATABASE.length} frames, found ${data.frames?.length ?? 0}`);
}

if (normalized.length !== data.frames.length) {
  throw new Error(`Runtime normalized ${normalized.length} frames from ${data.frames.length} exported frames`);
}

if (data.nodePose?.nodePathCount !== nodePathSet.size) {
  throw new Error(`Expected nodePose metadata for ${nodePathSet.size} nodes, found ${data.nodePose?.nodePathCount}`);
}

const counts = Object.fromEntries(states.map((state) => [state, 0]));
const nodeMotionMetrics = {};

for (const frame of data.frames) {
  if (!states.includes(frame.state)) {
    throw new Error(`Unknown frame state ${frame.state}`);
  }

  counts[frame.state] += 1;
  assertPose(frame.id, frame.pose);
  assertNodePose(frame.id, frame.nodePose);

  if (!frame.feature || frame.feature.state !== frame.state) {
    throw new Error(`frame ${frame.id} has invalid feature state`);
  }

  for (const key of ["spine", "head", "arms", "legs", "wings", "tail"]) {
    const phase = frame.feature.phases?.[key];
    if (!phase || [phase.sin, phase.cos, phase.amplitude].some((value) => !Number.isFinite(value))) {
      throw new Error(`frame ${frame.id} has invalid ${key} phase data`);
    }
  }
}

for (const state of states) {
  if (counts[state] !== 18 || data.frameCounts?.[state] !== 18) {
    throw new Error(`Expected 18 exported frames for ${state}, found ${counts[state]} / ${data.frameCounts?.[state]}`);
  }

  const matchedFrame = queryMotionDatabase(
    {
      t: 1.1,
      pointerX: 0.1,
      pointerY: -0.1,
      state,
      transition: 1,
      intent: data.intents[state],
    },
    normalized,
  );

  if (matchedFrame.state !== state) {
    throw new Error(`Runtime query for ${state} matched ${matchedFrame.state}`);
  }

  const sampleInputs = {
    t: 1.1,
    pointerX: 0.1,
    pointerY: -0.1,
    state,
    transition: 1,
    intent: data.intents[state],
  };
  assertPose(`runtime:${state}`, sampleMotionClip(sampleInputs, normalized));
  assertNodePose(`runtime:${state}`, sampleMotionFrame({ ...sampleInputs, databaseWeight: 1 }, normalized).nodePose);

  const nodeSamples = Array.from({ length: 36 }, (_, index) =>
    sampleMotionFrame(
      {
        t: index / 18,
        pointerX: Math.sin(index / 9) * 0.18,
        pointerY: Math.cos(index / 11) * 0.12,
        state,
        transition: 1,
        intent: data.intents[state],
        databaseWeight: 1,
      },
      normalized,
    ).nodePose,
  );

  let totalNodeMotion = 0;
  let maxNodeFrameDelta = 0;
  for (let index = 1; index < nodeSamples.length; index += 1) {
    const distance = nodePoseDistance(nodeSamples[index - 1], nodeSamples[index]);
    totalNodeMotion += distance;
    maxNodeFrameDelta = Math.max(maxNodeFrameDelta, distance);
  }

  if (totalNodeMotion < 0.5) {
    throw new Error(`Runtime exact-node motion for ${state} is too static: ${totalNodeMotion.toFixed(3)}`);
  }

  if (maxNodeFrameDelta > 45) {
    throw new Error(`Runtime exact-node motion for ${state} has a discontinuous jump: ${maxNodeFrameDelta.toFixed(3)}`);
  }

  nodeMotionMetrics[state] = {
    samples: nodeSamples.length,
    totalNodeMotion: Number(totalNodeMotion.toFixed(3)),
    maxNodeFrameDelta: Number(maxNodeFrameDelta.toFixed(3)),
  };
}

console.log(
  JSON.stringify(
    {
      schema: data.schema,
      frameCount: data.frames.length,
      normalizedFrameCount: normalized.length,
      nodePathCount: nodePathSet.size,
      counts,
      nodeMotionMetrics,
    },
    null,
    2,
  ),
);
