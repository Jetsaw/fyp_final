import fs from "node:fs";
import path from "node:path";

const [outputArg = "artifacts/ebee_full_rig_ai4animation_export.json"] = process.argv.slice(2);
const outputPath = path.resolve(outputArg);
const rigMapPath = path.resolve("public/avatar/ebee_new/ebee_rig_map.json");
const schemaPath = path.resolve("public/avatar/ebee_new/ebee_ai4animation_export.schema.json");
const rigMap = JSON.parse(fs.readFileSync(rigMapPath, "utf8"));
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const contract = schema["x-ebee-contract"];
const states = contract.states;
const joints = contract.joints;
const phaseChannels = contract.phaseChannels;
const framesPerState = 36;
const motionScale = 0.34;

const stateProfiles = {
  READY: { energy: 0.42, gesture: 0.22, attention: 0.55, step: 0.08, tempo: 0.75 },
  LISTENING: { energy: 0.55, gesture: 0.28, attention: 0.9, step: 0.06, tempo: 0.9 },
  THINKING: { energy: 0.5, gesture: 0.34, attention: 0.76, step: 0.04, tempo: 0.62 },
  SPEAKING: { energy: 0.88, gesture: 0.92, attention: 0.95, step: 0.16, tempo: 1.28 },
  NEEDS_REVIEW: { energy: 0.62, gesture: 0.48, attention: 0.86, step: 0.05, tempo: 0.7 },
};

const groupAmplitudes = {
  root: [0.018, 0.03, 0.018],
  spine: [0.045, 0.04, 0.03],
  chest: [0.04, 0.045, 0.035],
  neck: [0.055, 0.05, 0.03],
  head: [0.07, 0.06, 0.04],
  facePlate: [0.025, 0.032, 0.02],
  antenna: [0.09, 0.06, 0.08],
  shoulderL: [0.07, 0.08, 0.06],
  elbowL: [0.08, 0.07, 0.05],
  wristL: [0.07, 0.08, 0.07],
  fingersL: [0.06, 0.05, 0.05],
  shoulderR: [0.07, 0.08, 0.06],
  elbowR: [0.08, 0.07, 0.05],
  wristR: [0.07, 0.08, 0.07],
  fingersR: [0.06, 0.05, 0.05],
  hipL: [0.035, 0.03, 0.025],
  kneeL: [0.04, 0.025, 0.02],
  ankleL: [0.035, 0.025, 0.025],
  toesL: [0.025, 0.02, 0.018],
  hipR: [0.035, 0.03, 0.025],
  kneeR: [0.04, 0.025, 0.02],
  ankleR: [0.035, 0.025, 0.025],
  toesR: [0.025, 0.02, 0.018],
  wingL: [0.11, 0.08, 0.12],
  wingR: [0.11, 0.08, 0.12],
  tail: [0.08, 0.07, 0.06],
};

const mirrorGroups = new Set([
  "shoulderR",
  "elbowR",
  "wristR",
  "fingersR",
  "hipR",
  "kneeR",
  "ankleR",
  "toesR",
  "wingR",
]);

function hashPath(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function round(value) {
  return Number(value.toFixed(5));
}

function tupleFor(group, nodePath, phase, profile) {
  const amplitudes = groupAmplitudes[group] ?? [0.025, 0.025, 0.025];
  const hash = hashPath(nodePath);
  const offset = (hash % 6283) / 1000;
  const local = phase * profile.tempo + offset;
  const mirror = mirrorGroups.has(group) ? -1 : 1;
  const energy = 0.55 + profile.energy * 0.65;

  return [
    round(Math.sin(local) * amplitudes[0] * energy * motionScale),
    round(Math.cos(local * 0.73 + 0.45) * amplitudes[1] * energy * mirror * motionScale),
    round(Math.sin(local * 1.17 + 0.9) * amplitudes[2] * energy * mirror * motionScale),
  ];
}

function averageTuples(values) {
  if (values.length === 0) {
    return [0, 0, 0];
  }

  const total = values.reduce(
    (sum, tuple) => [sum[0] + tuple[0], sum[1] + tuple[1], sum[2] + tuple[2]],
    [0, 0, 0],
  );
  return total.map((value) => round(value / values.length));
}

function controlsFor(state, phase) {
  const profile = stateProfiles[state];
  return {
    facing: round(Math.sin(phase * 0.3) * 0.08),
    energy: profile.energy,
    gesture: profile.gesture,
    attention: profile.attention,
    step: profile.step,
  };
}

function phasesFor(state, phase) {
  const profile = stateProfiles[state];
  return Object.fromEntries(
    phaseChannels.map((channel, index) => {
      const local = phase * profile.tempo + index * 0.48;
      return [
        channel,
        {
          sin: round(Math.sin(local)),
          cos: round(Math.cos(local)),
          amplitude: round(0.35 + profile.energy * 0.65),
        },
      ];
    }),
  );
}

function trajectoryFor(time, state) {
  const step = stateProfiles[state].step;
  return [-0.25, 0, 0.35, 0.7, 1.05].map((offset) => ({
    time: offset,
    position: [round(Math.sin(time + offset) * step), round(Math.max(0, offset) * (0.12 + step))],
    direction: [round(Math.sin(time * 0.4) * 0.08), 1],
  }));
}

function buildFrame(state, frameIndex) {
  const time = frameIndex / 30;
  const phase = (frameIndex / framesPerState) * Math.PI * 2;
  const nodePose = {};
  const groupTuples = Object.fromEntries(joints.map((joint) => [joint, []]));

  for (const [group, nodes] of Object.entries(rigMap.groups ?? {})) {
    for (const node of nodes) {
      const tuple = tupleFor(group, node.path, phase, stateProfiles[state]);
      nodePose[node.path] = tuple;
      if (groupTuples[group]) {
        groupTuples[group].push(tuple);
      }
    }
  }

  const jointPose = Object.fromEntries(joints.map((joint) => [joint, averageTuples(groupTuples[joint] ?? [])]));

  return {
    id: `ebee-full-rig-${state}-${String(frameIndex).padStart(3, "0")}`,
    state,
    time: round(time),
    normalizedTime: round(frameIndex / framesPerState),
    controls: controlsFor(state, phase),
    localPhases: phasesFor(state, phase),
    trajectory: trajectoryFor(time, state),
    nodePose,
    joints: jointPose,
  };
}

const payload = {
  schema: "ai4animation-motion-export/v1",
  source: "Unity AI4Animation prepared project full-rig Ebee export",
  avatar: "Ebee",
  notes: [
    "Generated from the Ebee 750-node rig map for the prepared Unity AI4Animation project.",
    "Provides smooth full-rig runtime nodePose coverage while large upstream MotionData assets remain optional.",
  ],
  clips: states.map((state) => ({
    name: `EbeeFullRig_${state}`,
    state,
    frames: Array.from({ length: framesPerState }, (_, index) => buildFrame(state, index)),
  })),
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      status: "generated",
      outputPath,
      schema: payload.schema,
      source: payload.source,
      states: states.length,
      framesPerState,
      totalFrames: states.length * framesPerState,
      nodePoseCount: rigMap.controllableNodeCount,
    },
    null,
    2,
  ),
);
