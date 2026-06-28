import fs from "node:fs";
import path from "node:path";
import {
  MOTION_DATABASE,
  MOTION_CLIPS,
  STATE_INTENTS,
} from "../src/components/ebeeRigController.ts";

const outputPath = path.resolve("public/avatar/ebee_new/ebee_motion_database.json");
const rigMapPath = path.resolve("public/avatar/ebee_new/ebee_rig_map.json");

if (!fs.existsSync(rigMapPath)) {
  throw new Error("Missing Ebee rig map. Run npm run avatar:rig:export first.");
}

const rigMap = JSON.parse(fs.readFileSync(rigMapPath, "utf8"));
const states = Object.keys(MOTION_CLIPS);
const frameCounts = Object.fromEntries(states.map((state) => [state, 0]));
const nodeEntries = Object.entries(rigMap.groups ?? {}).flatMap(([group, nodes]) =>
  nodes.map((node, index) => ({
    group,
    index,
    path: node.path,
    type: node.type,
  })),
);
const uniqueNodePaths = new Set(nodeEntries.map((node) => node.path));

function hashPath(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function scaleTuple(tuple, amount) {
  return tuple.map((value) => Number((value * amount).toFixed(5)));
}

function buildNodePose(frame) {
  const contributions = new Map();

  for (const node of nodeEntries) {
    const target = frame.pose[node.group];
    if (!target) continue;

    const hash = hashPath(node.path);
    const typeWeight = node.type === "Bone" ? 1 : node.type === "Group" ? 0.72 : 0.42;
    const localWeight = typeWeight * (0.52 + ((hash + node.index) % 37) / 100);
    const scaled = scaleTuple(target, localWeight);
    const existing = contributions.get(node.path) ?? { sum: [0, 0, 0], count: 0 };

    existing.sum[0] += scaled[0];
    existing.sum[1] += scaled[1];
    existing.sum[2] += scaled[2];
    existing.count += 1;
    contributions.set(node.path, existing);
  }

  return Object.fromEntries(
    [...contributions.entries()].map(([nodePath, value]) => [
      nodePath,
      value.sum.map((axis) => Number((axis / value.count).toFixed(5))),
    ]),
  );
}

const frames = MOTION_DATABASE.map((frame) => ({
  ...frame,
  nodePose: buildNodePose(frame),
}));

for (const frame of frames) {
  frameCounts[frame.state] += 1;
}

const payload = {
  schema: "hive-ebee-motion-database/v1",
  source: "procedural-ai4animation-adapter",
  generatedBy: "scripts/export-ebee-motion-database.mjs",
  notes: [
    "Deterministic motion-query data generated from the Ebee runtime controller.",
    "Replace frames with exported AI4Animation motion data without changing the avatar rig API.",
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
  nodePose: {
    source: "derived-from-rig-map-groups",
    nodePathCount: uniqueNodePaths.size,
  },
  frames,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      outputPath,
      schema: payload.schema,
      frameCount: payload.frames.length,
      nodePathCount: payload.nodePose.nodePathCount,
      frameCounts,
    },
    null,
    2,
  ),
);
