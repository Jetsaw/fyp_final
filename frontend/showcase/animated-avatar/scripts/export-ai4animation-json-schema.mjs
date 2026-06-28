import fs from "node:fs";
import path from "node:path";

const avatarDir = path.resolve("public/avatar/ebee_new");
const contractPath = path.join(avatarDir, "ebee_ai4animation_contract.json");
const outputPath = path.join(avatarDir, "ebee_ai4animation_export.schema.json");

if (!fs.existsSync(contractPath)) {
  throw new Error("Missing Ebee AI4Animation contract. Run npm run avatar:ai4animation:contract:export.");
}

const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const states = Object.keys(contract.states ?? {});
const controls = Object.keys(contract.controls ?? {});
const phaseChannels = Object.keys(contract.phaseChannels ?? {});
const joints = Object.keys(contract.jointGroups ?? {});
const nodePaths = (contract.controllableNodes ?? []).map((node) => node.path);

const numberTuple = {
  type: "array",
  minItems: 3,
  maxItems: 3,
  items: {
    type: "number",
  },
};
const vector2Tuple = {
  type: "array",
  minItems: 2,
  maxItems: 2,
  items: {
    type: "number",
  },
};
const trajectorySample = {
  type: "object",
  required: ["position", "direction"],
  additionalProperties: true,
  properties: {
    time: { type: "number" },
    offset: { type: "number" },
    position: vector2Tuple,
    direction: vector2Tuple,
  },
};

const controlProperties = Object.fromEntries(controls.map((control) => [control, { type: "number" }]));
const phaseProperties = Object.fromEntries(
  phaseChannels.map((channel) => [
    channel,
    {
      type: "object",
      required: ["sin", "cos", "amplitude"],
      additionalProperties: false,
      properties: {
        sin: { type: "number" },
        cos: { type: "number" },
        amplitude: { type: "number" },
      },
    },
  ]),
);
const jointProperties = Object.fromEntries(joints.map((joint) => [joint, numberTuple]));
const nodePoseProperties = Object.fromEntries(nodePaths.map((nodePath) => [nodePath, numberTuple]));

const frameSchema = {
  type: "object",
  required: ["state", "time"],
  additionalProperties: true,
  anyOf: [
    { required: ["joints"] },
    { required: ["pose"] },
    { required: ["rotations"] },
    { required: ["nodePose"] },
    { required: ["nodes"] },
    { required: ["fineJoints"] },
  ],
  properties: {
    id: { type: "string" },
    clip: { type: "string" },
    state: { enum: states },
    time: { type: "number", minimum: 0 },
    timestamp: { type: "number", minimum: 0 },
    normalizedTime: { type: "number" },
    phase: { type: "number" },
    controls: {
      type: "object",
      additionalProperties: false,
      properties: controlProperties,
    },
    intent: {
      type: "object",
      additionalProperties: false,
      properties: controlProperties,
    },
    feature: {
      type: "object",
      additionalProperties: true,
      properties: {
        ...controlProperties,
        trajectory: {
          type: "array",
          minItems: 1,
          items: trajectorySample,
        },
        nodePose: {
          type: "object",
          minProperties: 1,
          additionalProperties: false,
          properties: nodePoseProperties,
        },
        phases: {
          type: "object",
          additionalProperties: false,
          properties: phaseProperties,
        },
      },
    },
    localPhases: {
      type: "object",
      additionalProperties: false,
      properties: phaseProperties,
    },
    phases: {
      type: "object",
      additionalProperties: false,
      properties: phaseProperties,
    },
    trajectory: {
      type: "array",
      minItems: 1,
      items: trajectorySample,
    },
    joints: {
      type: "object",
      minProperties: 1,
      additionalProperties: false,
      properties: jointProperties,
    },
    pose: {
      type: "object",
      minProperties: 1,
      additionalProperties: false,
      properties: jointProperties,
    },
    rotations: {
      type: "object",
      minProperties: 1,
      additionalProperties: false,
      properties: jointProperties,
    },
    nodePose: {
      type: "object",
      minProperties: 1,
      additionalProperties: false,
      properties: nodePoseProperties,
    },
    nodes: {
      type: "object",
      minProperties: 1,
      additionalProperties: false,
      properties: nodePoseProperties,
    },
    fineJoints: {
      type: "object",
      minProperties: 1,
      additionalProperties: false,
      properties: nodePoseProperties,
    },
  },
};

const schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://hive.local/avatar/ebee/ai4animation-export.schema.json",
  title: "Ebee AI4Animation Motion Export",
  description: "Schema for offline AI4Animation-style exports accepted by the Ebee avatar importer.",
  type: "object",
  required: ["schema"],
  additionalProperties: true,
  properties: {
    schema: { const: "ai4animation-motion-export/v1" },
    source: { type: "string" },
    frames: {
      type: "array",
      minItems: 1,
      items: frameSchema,
    },
    clips: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["name", "state", "frames"],
        additionalProperties: true,
        properties: {
          name: { type: "string" },
          state: { enum: states },
          frames: {
            type: "array",
            minItems: 1,
            items: frameSchema,
          },
        },
      },
    },
  },
  anyOf: [
    { required: ["frames"] },
    { required: ["clips"] },
  ],
  "x-ebee-contract": {
    contractSchema: contract.schema,
    states,
    controls,
    phaseChannels,
    trajectorySampleTimes: contract.trajectory?.sampleTimes ?? [],
    joints,
    nodePaths,
  },
};

fs.writeFileSync(outputPath, `${JSON.stringify(schema, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      outputPath,
      schema: schema.properties.schema.const,
      states: states.length,
      controls: controls.length,
      phaseChannels: phaseChannels.length,
      trajectorySamples: schema["x-ebee-contract"].trajectorySampleTimes.length,
      joints: joints.length,
      nodePaths: nodePaths.length,
    },
    null,
    2,
  ),
);
