import fs from "node:fs";
import path from "node:path";
import {
  JOINT_CONTROLS,
  MOTION_CLIPS,
  STATE_INTENTS,
  buildTrajectorySamples,
  sampleLocalPhaseChannels,
} from "../src/components/ebeeRigController.ts";

const [inputArg, outputArg = "public/avatar/ebee_new/ebee_motion_database.json"] = process.argv.slice(2);

if (!inputArg) {
  throw new Error("Usage: node scripts/import-ai4animation-motion.mjs <input-json> [output-json]");
}

const inputPath = path.resolve(inputArg);
const outputPath = path.resolve(outputArg);
const rigMapPath = path.resolve("public/avatar/ebee_new/ebee_rig_map.json");
const source = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const rigMap = JSON.parse(fs.readFileSync(rigMapPath, "utf8"));
const states = Object.keys(MOTION_CLIPS);
const jointSet = new Set(JOINT_CONTROLS);
const nodePathSet = new Set(
  Object.values(rigMap.groups ?? {}).flatMap((nodes) => nodes.map((node) => node.path)),
);

function toTuple(value, frameId, joint) {
  if (!Array.isArray(value) || value.length !== 3) {
    throw new Error(`frame ${frameId}.${joint} must be an XYZ tuple`);
  }

  const tuple = value.map(Number);
  if (tuple.some((item) => !Number.isFinite(item))) {
    throw new Error(`frame ${frameId}.${joint} must contain finite numbers`);
  }

  return tuple;
}

function normalizePose(frame) {
  const rawPose = frame.pose ?? frame.joints ?? frame.rotations ?? {};
  const pose = {};

  for (const [joint, target] of Object.entries(rawPose)) {
    if (!jointSet.has(joint)) continue;
    pose[joint] = toTuple(target, frame.id ?? frame.state, joint);
  }

  return pose;
}

function normalizeNodePose(frame) {
  const rawNodePose = frame.nodePose ?? frame.nodes ?? frame.fineJoints ?? frame.feature?.nodePose ?? {};
  const nodePose = {};

  for (const [nodePath, target] of Object.entries(rawNodePose)) {
    if (!nodePathSet.has(nodePath)) continue;
    nodePose[nodePath] = toTuple(target, frame.id ?? frame.state, nodePath);
  }

  return nodePose;
}

function normalizeIntent(frame, state) {
  const controls = frame.controls ?? frame.intent ?? frame.feature ?? {};
  const intent = {
    facing: Number(controls.facing ?? STATE_INTENTS[state].facing),
    energy: Number(controls.energy ?? STATE_INTENTS[state].energy),
    gesture: Number(controls.gesture ?? STATE_INTENTS[state].gesture),
    attention: Number(controls.attention ?? STATE_INTENTS[state].attention),
    step: Number(controls.step ?? STATE_INTENTS[state].step),
  };

  for (const [key, value] of Object.entries(intent)) {
    if (!Number.isFinite(value)) {
      throw new Error(`frame ${frame.id ?? state} control ${key} must be finite`);
    }
  }

  return intent;
}

function normalizePhases(frame, state, time, intent) {
  const rawPhases = frame.localPhases ?? frame.phases ?? frame.feature?.phases;
  if (rawPhases) {
    return Object.fromEntries(
      ["spine", "head", "arms", "legs", "wings", "tail"].map((key) => {
        const phase = rawPhases[key] ?? {};
        const normalizedPhase = {
          sin: Number(phase.sin ?? 0),
          cos: Number(phase.cos ?? 1),
          amplitude: Number(phase.amplitude ?? 0),
        };

        if (Object.values(normalizedPhase).some((value) => !Number.isFinite(value))) {
          throw new Error(`frame ${frame.id ?? state} phase ${key} must contain finite numbers`);
        }

        return [
          key,
          normalizedPhase,
        ];
      }),
    );
  }

  const phases = sampleLocalPhaseChannels(time, state, intent);
  return Object.fromEntries(
    Object.entries(phases).map(([key, phase]) => [
      key,
      {
        sin: Math.sin(phase.phase),
        cos: Math.cos(phase.phase),
        amplitude: phase.amplitude,
      },
    ]),
  );
}

function toVector2(value, frameId, label) {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new Error(`frame ${frameId}.${label} must be an XZ tuple`);
  }

  const tuple = value.map(Number);
  if (tuple.some((item) => !Number.isFinite(item))) {
    throw new Error(`frame ${frameId}.${label} must contain finite numbers`);
  }

  return tuple;
}

function normalizeTrajectory(frame, state, time, intent) {
  const rawTrajectory = frame.trajectory ?? frame.feature?.trajectory;
  if (rawTrajectory) {
    if (!Array.isArray(rawTrajectory) || rawTrajectory.length === 0) {
      throw new Error(`frame ${frame.id ?? state}.trajectory must be a non-empty array`);
    }

    return rawTrajectory.map((sample, index) => {
      const sampleTime = Number(sample.time ?? sample.offset ?? 0);
      if (!Number.isFinite(sampleTime)) {
        throw new Error(`frame ${frame.id ?? state}.trajectory[${index}].time must be finite`);
      }

      return {
        time: sampleTime,
        position: toVector2(sample.position, frame.id ?? state, `trajectory[${index}].position`),
        direction: toVector2(sample.direction, frame.id ?? state, `trajectory[${index}].direction`),
      };
    });
  }

  return buildTrajectorySamples({
    t: time,
    pointerX: 0,
    pointerY: 0,
    state,
    transition: 1,
    intent,
  });
}

function normalizeFeature(frame, state, time, intent) {
  const clip = MOTION_CLIPS[state];
  const normalizedTime = Number(frame.normalizedTime ?? frame.phase ?? ((time % clip.duration) / clip.duration));

  if (!Number.isFinite(normalizedTime)) {
    throw new Error(`frame ${frame.id ?? state} normalized time must be finite`);
  }

  return {
    state,
    normalizedTime,
    facing: intent.facing,
    energy: intent.energy,
    gesture: intent.gesture,
    attention: intent.attention,
    step: intent.step,
    phases: normalizePhases(frame, state, time, intent),
    trajectory: normalizeTrajectory(frame, state, time, intent),
  };
}

function sourceFrames() {
  if (Array.isArray(source.frames)) return source.frames;

  return (source.clips ?? []).flatMap((clip) =>
    (clip.frames ?? []).map((frame, index) => ({
      ...frame,
      id: frame.id ?? `${clip.name ?? clip.state}-${index.toString().padStart(3, "0")}`,
      clip: frame.clip ?? clip.name,
      state: frame.state ?? clip.state,
    })),
  );
}

const frames = sourceFrames().map((frame, index) => {
  if (!states.includes(frame.state)) {
    throw new Error(`frame ${frame.id ?? index} has unsupported state ${frame.state}`);
  }

  const time = Number(frame.time ?? frame.timestamp ?? 0);
  if (!Number.isFinite(time) || time < 0) {
    throw new Error(`frame ${frame.id ?? index} has invalid time ${frame.time}`);
  }

  const pose = normalizePose(frame);
  const nodePose = normalizeNodePose(frame);
  if (Object.keys(pose).length === 0 && Object.keys(nodePose).length === 0) {
    throw new Error(`frame ${frame.id ?? index} has no usable Ebee joint or node pose data`);
  }

  const intent = normalizeIntent(frame, frame.state);

  return {
    id: String(frame.id ?? `${frame.state}-${index.toString().padStart(3, "0")}`),
    clip: String(frame.clip ?? MOTION_CLIPS[frame.state].name),
    time,
    state: frame.state,
    feature: normalizeFeature(frame, frame.state, time, intent),
    pose,
    nodePose,
  };
});

if (frames.length === 0) {
  throw new Error("input file did not contain any importable AI4Animation frames");
}

const frameCounts = Object.fromEntries(states.map((state) => [state, 0]));
for (const frame of frames) frameCounts[frame.state] += 1;

const payload = {
  schema: "hive-ebee-motion-database/v1",
  source: source.source ?? "ai4animation-export",
  sourceSchema: source.schema ?? "ai4animation-motion-export/v1",
  generatedBy: "scripts/import-ai4animation-motion.mjs",
  notes: [
    "Imported AI4Animation-style clips, controls, phase features, joint poses, and exact rig-node poses into the Ebee runtime schema.",
    "This adapter is the handoff point for replacing generated procedural frames with trained/offline AI4Animation data.",
  ],
  states,
  intents: STATE_INTENTS,
  clips: Object.fromEntries(
    Object.entries(MOTION_CLIPS).map(([state, clip]) => [
      state,
      {
        name: clip.name,
        duration: clip.duration,
        energy: clip.energy,
        wingRate: clip.wingRate,
        talkRate: clip.talkRate,
      },
    ]),
  ),
  frameCounts,
  frames,
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
      frameCount: frames.length,
      frameCounts,
    },
    null,
    2,
  ),
);
