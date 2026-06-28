import fs from "node:fs";
import path from "node:path";
import {
  JOINT_CONTROLS,
  MOTION_CLIPS,
  normalizeMotionDatabase,
  queryMotionDatabaseBlend,
  sampleMotionFrame,
} from "../src/components/ebeeRigController.ts";

const args = process.argv.slice(2);
const allowSample = args.includes("--allow-sample");
const positional = args.filter((arg) => arg !== "--allow-sample");
const [inputArg, outputArg = "public/avatar/ebee_new/ebee_ai4animation_motion_database.json"] = positional;

if (!inputArg) {
  throw new Error("Usage: node scripts/promote-ai4animation-motion.mjs <input-db-json> [output-db-json] [--allow-sample]");
}

const inputPath = path.resolve(inputArg);
const outputPath = path.resolve(outputArg);
const publicAvatarDir = path.resolve("public/avatar/ebee_new");
const rigMapPath = path.resolve("public/avatar/ebee_new/ebee_rig_map.json");
const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const rigMap = JSON.parse(fs.readFileSync(rigMapPath, "utf8"));
const normalized = normalizeMotionDatabase(data);
const states = Object.keys(MOTION_CLIPS);
const jointSet = new Set(JOINT_CONTROLS);
const nodePathSet = new Set(Object.values(rigMap.groups ?? {}).flatMap((nodes) => nodes.map((node) => node.path)));
const requiredPhaseChannels = ["spine", "head", "arms", "legs", "wings", "tail"];
const minFramesPerState = allowSample ? 1 : 12;
const minNodePoseCoverage = allowSample ? 1 : Math.max(1, Math.floor(nodePathSet.size * 0.85));

if (allowSample && outputPath.startsWith(publicAvatarDir)) {
  throw new Error("Sample AI4Animation promotion cannot write into public avatar assets.");
}

function assertPose(frameId, pose) {
  if (!pose || Object.keys(pose).length === 0) {
    throw new Error(`frame ${frameId} has no pose data`);
  }

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
    throw new Error(`frame ${frameId} has no exact rig-node pose data`);
  }

  const nodePaths = Object.keys(nodePose);
  if (nodePaths.length < minNodePoseCoverage) {
    throw new Error(`frame ${frameId} needs at least ${minNodePoseCoverage} nodePose entries, found ${nodePaths.length}`);
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
  const nodePaths = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]);
  let sum = 0;

  for (const nodePath of nodePaths) {
    const av = a?.[nodePath] ?? [0, 0, 0];
    const bv = b?.[nodePath] ?? [0, 0, 0];
    sum += Math.hypot(av[0] - bv[0], av[1] - bv[1], av[2] - bv[2]);
  }

  return sum;
}

if (data.schema !== "hive-ebee-motion-database/v1") {
  throw new Error(`Unexpected motion database schema ${data.schema}`);
}

if (data.sourceSchema !== "ai4animation-motion-export/v1") {
  throw new Error(`AI4Animation promotion requires sourceSchema ai4animation-motion-export/v1, found ${data.sourceSchema}`);
}

if (normalized.length !== data.frames.length) {
  throw new Error(`Runtime normalized ${normalized.length} frames from ${data.frames.length} AI4Animation frames`);
}

const frameCounts = Object.fromEntries(states.map((state) => [state, 0]));

for (const frame of data.frames) {
  if (!states.includes(frame.state)) {
    throw new Error(`frame ${frame.id} has unsupported state ${frame.state}`);
  }

  frameCounts[frame.state] += 1;
  assertPose(frame.id, frame.pose);
  assertNodePose(frame.id, frame.nodePose);

  if (!frame.feature || frame.feature.state !== frame.state) {
    throw new Error(`frame ${frame.id} has invalid feature state`);
  }

  for (const channel of requiredPhaseChannels) {
    const phase = frame.feature.phases?.[channel];
    if (!phase || [phase.sin, phase.cos, phase.amplitude].some((value) => !Number.isFinite(value))) {
      throw new Error(`frame ${frame.id} has invalid ${channel} phase data`);
    }
  }
}

for (const state of states) {
  if (frameCounts[state] < minFramesPerState) {
    throw new Error(`AI4Animation promotion needs at least ${minFramesPerState} frames for ${state}, found ${frameCounts[state]}`);
  }

  const match = queryMotionDatabaseBlend(
    {
      t: 0.35,
      pointerX: 0.1,
      pointerY: -0.05,
      state,
      transition: 1,
      intent: data.intents[state],
    },
    normalized,
    Math.min(4, normalized.length),
  );

  if (match.candidates[0]?.frame.state !== state) {
    throw new Error(`AI4Animation promotion query for ${state} matched ${match.candidates[0]?.frame.state}`);
  }

  assertPose(`promotion-match:${state}`, match.pose);
  assertNodePose(`promotion-match:${state}`, match.nodePose);

  const sample = sampleMotionFrame(
    {
      t: 0.35,
      pointerX: 0.1,
      pointerY: -0.05,
      state,
      transition: 1,
      intent: data.intents[state],
      databaseWeight: 1,
    },
    normalized,
  );
  assertPose(`promotion-sample:${state}`, sample.pose);
  assertNodePose(`promotion-sample:${state}`, sample.nodePose);

  if (!allowSample) {
    const nodeSamples = Array.from({ length: 24 }, (_, index) =>
      sampleMotionFrame(
        {
          t: index / 12,
          pointerX: Math.sin(index / 8) * 0.18,
          pointerY: Math.cos(index / 10) * 0.12,
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
      throw new Error(`AI4Animation production promotion node motion for ${state} is too static: ${totalNodeMotion.toFixed(3)}`);
    }

    if (maxNodeFrameDelta > 45) {
      throw new Error(`AI4Animation production promotion node motion for ${state} has a discontinuous jump: ${maxNodeFrameDelta.toFixed(3)}`);
    }
  }
}

const payload = {
  ...data,
  promotedBy: "scripts/promote-ai4animation-motion.mjs",
  promotion: {
    minFramesPerState,
    minNodePoseCoverage,
    sampleOnly: allowSample,
    frameCounts,
  },
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      inputPath,
      outputPath,
      schema: payload.schema,
      sourceSchema: payload.sourceSchema,
      frameCount: payload.frames.length,
      minFramesPerState,
      minNodePoseCoverage,
      sampleOnly: allowSample,
      frameCounts,
    },
    null,
    2,
  ),
);
