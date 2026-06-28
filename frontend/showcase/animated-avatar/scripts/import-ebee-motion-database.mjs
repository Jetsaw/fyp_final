import fs from "node:fs";
import path from "node:path";
import {
  JOINT_CONTROLS,
  MOTION_CLIPS,
  STATE_INTENTS,
  sampleLocalPhaseChannels,
} from "../src/components/ebeeRigController.ts";

const [inputArg, outputArg = "public/avatar/ebee_new/ebee_motion_database.json"] = process.argv.slice(2);

if (!inputArg) {
  throw new Error("Usage: node scripts/import-ebee-motion-database.mjs <input-json> [output-json]");
}

const inputPath = path.resolve(inputArg);
const outputPath = path.resolve(outputArg);
const source = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const states = Object.keys(MOTION_CLIPS);
const jointSet = new Set(JOINT_CONTROLS);

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
  const pose = {};

  for (const [joint, target] of Object.entries(frame.pose ?? {})) {
    if (!jointSet.has(joint)) continue;
    pose[joint] = toTuple(target, frame.id ?? frame.state, joint);
  }

  return pose;
}

function buildFeature(frame) {
  if (frame.feature?.phases && frame.feature.state === frame.state) return frame.feature;

  const state = frame.state;
  const intent = {
    ...STATE_INTENTS[state],
    ...(frame.intent ?? {}),
  };
  const time = Number(frame.time ?? 0);
  const phases = sampleLocalPhaseChannels(time, state, intent);

  return {
    state,
    normalizedTime: Number(frame.normalizedTime ?? ((time % MOTION_CLIPS[state].duration) / MOTION_CLIPS[state].duration)),
    facing: Number(intent.facing ?? 0),
    energy: Number(intent.energy ?? 0),
    gesture: Number(intent.gesture ?? 0),
    attention: Number(intent.attention ?? 0),
    step: Number(intent.step ?? 0),
    phases: Object.fromEntries(
      Object.entries(phases).map(([key, phase]) => [
        key,
        {
          sin: Math.sin(phase.phase),
          cos: Math.cos(phase.phase),
          amplitude: phase.amplitude,
        },
      ]),
    ),
  };
}

const frames = (source.frames ?? []).map((frame, index) => {
  if (!states.includes(frame.state)) {
    throw new Error(`frame ${frame.id ?? index} has unsupported state ${frame.state}`);
  }

  const pose = normalizePose(frame);
  if (Object.keys(pose).length === 0) {
    throw new Error(`frame ${frame.id ?? index} has no usable Ebee joint pose data`);
  }

  return {
    id: String(frame.id ?? `${frame.state}-${index.toString().padStart(3, "0")}`),
    clip: String(frame.clip ?? MOTION_CLIPS[frame.state].name),
    time: Number(frame.time ?? 0),
    state: frame.state,
    feature: buildFeature(frame),
    pose,
  };
});

if (frames.length === 0) {
  throw new Error("input file did not contain any importable frames");
}

const frameCounts = Object.fromEntries(states.map((state) => [state, 0]));
for (const frame of frames) frameCounts[frame.state] += 1;

const payload = {
  schema: "hive-ebee-motion-database/v1",
  source: source.source ?? "external-ai4animation-import",
  generatedBy: "scripts/import-ebee-motion-database.mjs",
  notes: [
    "Imported external motion frames into the Ebee runtime motion database schema.",
    "Frames may come from AI4Animation or another offline motion-processing pipeline.",
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
      frameCount: frames.length,
      frameCounts,
    },
    null,
    2,
  ),
);
