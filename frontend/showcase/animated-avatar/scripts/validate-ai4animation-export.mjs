import fs from "node:fs";
import path from "node:path";

const [inputArg, schemaArg = "public/avatar/ebee_new/ebee_ai4animation_export.schema.json"] = process.argv.slice(2);

if (!inputArg) {
  throw new Error("Usage: node scripts/validate-ai4animation-export.mjs <ai4animation-export-json> [schema-json]");
}

const inputPath = path.resolve(inputArg);
const schemaPath = path.resolve(schemaArg);
const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const extension = schema["x-ebee-contract"] ?? {};
const states = new Set(extension.states ?? []);
const controls = new Set(extension.controls ?? []);
const phaseChannels = new Set(extension.phaseChannels ?? []);
const joints = new Set(extension.joints ?? []);
const nodePaths = new Set(extension.nodePaths ?? []);
const counts = Object.fromEntries([...states].map((state) => [state, 0]));

function assertFiniteNumber(value, label) {
  if (!Number.isFinite(Number(value))) {
    throw new Error(`${label} must be a finite number`);
  }
}

function assertNoUnknownKeys(value, allowed, label) {
  for (const key of Object.keys(value ?? {})) {
    if (!allowed.has(key)) {
      throw new Error(`${label} contains unsupported key ${key}`);
    }
  }
}

function assertTuple(value, label) {
  if (!Array.isArray(value) || value.length !== 3) {
    throw new Error(`${label} must be an XYZ tuple`);
  }

  value.forEach((item, index) => assertFiniteNumber(item, `${label}[${index}]`));
}

function assertVector2(value, label) {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new Error(`${label} must be an XZ tuple`);
  }

  value.forEach((item, index) => assertFiniteNumber(item, `${label}[${index}]`));
}

function assertControls(value, label) {
  if (!value) return;
  assertNoUnknownKeys(value, controls, label);
  for (const [key, item] of Object.entries(value)) {
    assertFiniteNumber(item, `${label}.${key}`);
  }
}

function assertPhases(value, label) {
  if (!value) return;
  assertNoUnknownKeys(value, phaseChannels, label);

  for (const [key, phase] of Object.entries(value)) {
    for (const field of ["sin", "cos", "amplitude"]) {
      assertFiniteNumber(phase?.[field], `${label}.${key}.${field}`);
    }
  }
}

function assertTrajectory(value, label) {
  if (!value) return;
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${label} must be a non-empty array`);
  }

  value.forEach((sample, index) => {
    assertFiniteNumber(sample?.time ?? sample?.offset, `${label}[${index}].time`);
    assertVector2(sample?.position, `${label}[${index}].position`);
    assertVector2(sample?.direction, `${label}[${index}].direction`);
  });
}

function assertPose(value, label) {
  assertNoUnknownKeys(value, joints, label);
  if (Object.keys(value ?? {}).length === 0) {
    throw new Error(`${label} must contain at least one Ebee joint`);
  }

  for (const [joint, tuple] of Object.entries(value)) {
    assertTuple(tuple, `${label}.${joint}`);
  }
}

function assertNodePose(value, label) {
  if (!value) return false;
  assertNoUnknownKeys(value, nodePaths, label);
  if (Object.keys(value ?? {}).length === 0) {
    throw new Error(`${label} must contain at least one Ebee rig node`);
  }

  for (const [nodePath, tuple] of Object.entries(value)) {
    assertTuple(tuple, `${label}.${nodePath}`);
  }

  return true;
}

function assertFrame(frame, label, inheritedState, inheritedClip) {
  const state = frame.state ?? inheritedState;
  if (!states.has(state)) {
    throw new Error(`${label}.state must be one of ${[...states].join(", ")}`);
  }

  assertFiniteNumber(frame.time ?? frame.timestamp, `${label}.time`);
  if (Number(frame.time ?? frame.timestamp) < 0) {
    throw new Error(`${label}.time must be >= 0`);
  }

  if (frame.normalizedTime !== undefined) assertFiniteNumber(frame.normalizedTime, `${label}.normalizedTime`);
  if (frame.phase !== undefined) assertFiniteNumber(frame.phase, `${label}.phase`);
  if (frame.clip !== undefined && typeof frame.clip !== "string") {
    throw new Error(`${label}.clip must be a string`);
  }
  if (inheritedClip !== undefined && typeof inheritedClip !== "string") {
    throw new Error(`${label}.clip inherited from clip must be a string`);
  }

  assertControls(frame.controls, `${label}.controls`);
  assertControls(frame.intent, `${label}.intent`);
  assertControls(frame.feature, `${label}.feature`);
  assertPhases(frame.localPhases, `${label}.localPhases`);
  assertPhases(frame.phases, `${label}.phases`);
  assertPhases(frame.feature?.phases, `${label}.feature.phases`);
  assertTrajectory(frame.trajectory, `${label}.trajectory`);
  assertTrajectory(frame.feature?.trajectory, `${label}.feature.trajectory`);

  const pose = frame.joints ?? frame.pose ?? frame.rotations;
  const hasNodePose = [
    assertNodePose(frame.nodePose, `${label}.nodePose`),
    assertNodePose(frame.nodes, `${label}.nodes`),
    assertNodePose(frame.fineJoints, `${label}.fineJoints`),
    assertNodePose(frame.feature?.nodePose, `${label}.feature.nodePose`),
  ].some(Boolean);

  if (!pose && !hasNodePose) {
    throw new Error(`${label} must include joints, pose, rotations, nodePose, nodes, or fineJoints`);
  }
  if (pose) assertPose(pose, `${label}.pose`);

  counts[state] += 1;
}

if (schema.properties?.schema?.const !== "ai4animation-motion-export/v1") {
  throw new Error(`Validator schema is not for AI4Animation exports: ${schema.properties?.schema?.const}`);
}

if (data.schema !== "ai4animation-motion-export/v1") {
  throw new Error(`input schema must be ai4animation-motion-export/v1, found ${data.schema}`);
}

if (!Array.isArray(data.frames) && !Array.isArray(data.clips)) {
  throw new Error("input must contain frames or clips");
}

if (Array.isArray(data.frames)) {
  if (data.frames.length === 0) throw new Error("frames must not be empty");
  data.frames.forEach((frame, index) => assertFrame(frame, `frames[${index}]`));
}

if (Array.isArray(data.clips)) {
  if (data.clips.length === 0) throw new Error("clips must not be empty");
  data.clips.forEach((clip, clipIndex) => {
    if (typeof clip.name !== "string") throw new Error(`clips[${clipIndex}].name must be a string`);
    if (!states.has(clip.state)) throw new Error(`clips[${clipIndex}].state must be a valid Ebee state`);
    if (!Array.isArray(clip.frames) || clip.frames.length === 0) {
      throw new Error(`clips[${clipIndex}].frames must not be empty`);
    }
    clip.frames.forEach((frame, frameIndex) =>
      assertFrame(frame, `clips[${clipIndex}].frames[${frameIndex}]`, clip.state, clip.name),
    );
  });
}

console.log(
  JSON.stringify(
    {
      inputPath,
      schemaPath,
      schema: data.schema,
      states: states.size,
      controls: controls.size,
      phaseChannels: phaseChannels.size,
      joints: joints.size,
      nodePaths: nodePaths.size,
      frameCounts: counts,
    },
    null,
    2,
  ),
);
