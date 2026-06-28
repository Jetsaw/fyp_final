import fs from "node:fs";
import path from "node:path";
import {
  MOTION_CLIPS,
  normalizeMotionDatabase,
  queryMotionDatabaseBlend,
  sampleMotionFrame,
} from "../src/components/ebeeRigController.ts";

const args = process.argv.slice(2);
const allowSample = args.includes("--allow-sample");
const positional = args.filter((arg) => arg !== "--allow-sample");
const [inputArg, outputArg = "public/avatar/ebee_new/ebee_motion_database.json"] = positional;

if (!inputArg) {
  throw new Error("Usage: node scripts/install-ai4animation-motion.mjs <promoted-db-json> [runtime-db-json] [--allow-sample]");
}

const inputPath = path.resolve(inputArg);
const outputPath = path.resolve(outputArg);
const publicAvatarDir = path.resolve("public/avatar/ebee_new");
const rigMapPath = path.resolve("public/avatar/ebee_new/ebee_rig_map.json");
const relativeOutput = path.relative(publicAvatarDir, outputPath);
const outputInPublicAvatar = relativeOutput === "" || (!relativeOutput.startsWith("..") && !path.isAbsolute(relativeOutput));
const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const rigMap = JSON.parse(fs.readFileSync(rigMapPath, "utf8"));
const normalized = normalizeMotionDatabase(data);
const states = Object.keys(MOTION_CLIPS);
const nodePathSet = new Set(Object.values(rigMap.groups ?? {}).flatMap((nodes) => nodes.map((node) => node.path)));

if (data.schema !== "hive-ebee-motion-database/v1") {
  throw new Error(`Unexpected motion database schema ${data.schema}`);
}

if (data.sourceSchema !== "ai4animation-motion-export/v1") {
  throw new Error(`AI4Animation install requires sourceSchema ai4animation-motion-export/v1, found ${data.sourceSchema}`);
}

if (data.promotedBy !== "scripts/promote-ai4animation-motion.mjs") {
  throw new Error("AI4Animation install requires a promoted database. Run npm run avatar:ai4animation:promote first.");
}

if (data.promotion?.sampleOnly && !allowSample) {
  throw new Error("Refusing to install sample-only AI4Animation motion data.");
}

if (allowSample && outputInPublicAvatar) {
  throw new Error("Sample AI4Animation install cannot write into public avatar assets.");
}

if (normalized.length !== data.frames.length) {
  throw new Error(`Runtime normalized ${normalized.length} frames from ${data.frames.length} promoted AI4Animation frames`);
}

function assertNodePose(name, nodePose) {
  if (!nodePose || typeof nodePose !== "object") {
    throw new Error(`${name} has no exact rig-node pose data`);
  }

  const minNodePoseCoverage = data.promotion?.minNodePoseCoverage ?? (data.promotion?.sampleOnly ? 1 : Math.floor(nodePathSet.size * 0.85));
  const nodePaths = Object.keys(nodePose);
  if (nodePaths.length < minNodePoseCoverage) {
    throw new Error(`${name} needs at least ${minNodePoseCoverage} nodePose entries, found ${nodePaths.length}`);
  }

  for (const [nodePath, target] of Object.entries(nodePose)) {
    if (!nodePathSet.has(nodePath)) {
      throw new Error(`${name} references unknown node path ${nodePath}`);
    }

    if (!Array.isArray(target) || target.length !== 3 || target.some((value) => !Number.isFinite(value))) {
      throw new Error(`${name}.${nodePath} must be a finite XYZ tuple`);
    }
  }
}

for (const frame of data.frames) {
  assertNodePose(`install-frame:${frame.id}`, frame.nodePose);
}

for (const state of states) {
  if ((data.promotion?.frameCounts?.[state] ?? 0) < (data.promotion?.minFramesPerState ?? 12)) {
    throw new Error(`Promoted AI4Animation database has insufficient ${state} coverage`);
  }

  const intent = data.intents[state];
  const match = queryMotionDatabaseBlend(
    {
      t: 0.55,
      pointerX: 0.06,
      pointerY: -0.04,
      state,
      transition: 1,
      intent,
    },
    normalized,
    Math.min(4, normalized.length),
  );

  if (match.candidates[0]?.frame.state !== state) {
    throw new Error(`Install query for ${state} matched ${match.candidates[0]?.frame.state}`);
  }

  const sample = sampleMotionFrame(
    {
      t: 0.55,
      pointerX: 0.06,
      pointerY: -0.04,
      state,
      transition: 1,
      intent,
      databaseWeight: 1,
    },
    normalized,
  );

  if (Object.keys(sample.pose).length === 0) {
    throw new Error(`Install sample for ${state} returned an empty pose`);
  }
  assertNodePose(`install-sample:${state}`, sample.nodePose);
}

const payload = {
  ...data,
  installedBy: "scripts/install-ai4animation-motion.mjs",
  runtimeMotionDatabase: true,
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
      sampleOnly: payload.promotion?.sampleOnly ?? false,
      minNodePoseCoverage: payload.promotion?.minNodePoseCoverage ?? null,
      runtimeMotionDatabase: payload.runtimeMotionDatabase,
      outputInPublicAvatar,
    },
    null,
    2,
  ),
);
