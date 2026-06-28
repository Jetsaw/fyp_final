import fs from "node:fs";
import path from "node:path";

const avatarDir = path.resolve("public/avatar/ebee_new");
const contractPath = path.join(avatarDir, "ebee_ai4animation_contract.json");
const schemaPath = path.join(avatarDir, "ebee_ai4animation_export.schema.json");

if (!fs.existsSync(schemaPath)) {
  throw new Error("Missing Ebee AI4Animation JSON schema. Run npm run avatar:ai4animation:schema:export.");
}

const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const expectedStates = Object.keys(contract.states ?? {}).sort();
const expectedControls = Object.keys(contract.controls ?? {}).sort();
const expectedPhaseChannels = Object.keys(contract.phaseChannels ?? {}).sort();
const expectedJoints = Object.keys(contract.jointGroups ?? {}).sort();
const expectedTrajectorySampleTimes = contract.trajectory?.sampleTimes ?? [];
const expectedNodePaths = (contract.controllableNodes ?? []).map((node) => node.path).sort();
const extension = schema["x-ebee-contract"] ?? {};

function assertSame(label, actual, expected) {
  const actualValue = [...actual].sort().join(",");
  const expectedValue = [...expected].sort().join(",");
  if (actualValue !== expectedValue) {
    throw new Error(`${label} mismatch: ${actualValue} !== ${expectedValue}`);
  }
}

if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema") {
  throw new Error(`Unexpected JSON Schema draft ${schema.$schema}`);
}

if (schema.properties?.schema?.const !== "ai4animation-motion-export/v1") {
  throw new Error(`Unexpected export schema const ${schema.properties?.schema?.const}`);
}

if (extension.contractSchema !== "hive-ebee-ai4animation-contract/v1") {
  throw new Error(`Unexpected linked contract schema ${extension.contractSchema}`);
}

assertSame("state", extension.states ?? [], expectedStates);
assertSame("control", extension.controls ?? [], expectedControls);
assertSame("phase channel", extension.phaseChannels ?? [], expectedPhaseChannels);
assertSame("joint", extension.joints ?? [], expectedJoints);
assertSame("trajectory sample time", extension.trajectorySampleTimes ?? [], expectedTrajectorySampleTimes);
assertSame("node path", extension.nodePaths ?? [], expectedNodePaths);

const frameSchema = schema.properties?.frames?.items;
if (!frameSchema?.properties?.joints?.properties) {
  throw new Error("Schema is missing frame joints properties");
}

for (const joint of expectedJoints) {
  const tuple = frameSchema.properties.joints.properties[joint];
  if (!tuple || tuple.minItems !== 3 || tuple.maxItems !== 3) {
    throw new Error(`Schema missing XYZ tuple for joint ${joint}`);
  }
}

const nodePoseProperties = frameSchema.properties.nodePose?.properties;
if (!nodePoseProperties) {
  throw new Error("Schema is missing frame nodePose properties");
}

for (const nodePath of expectedNodePaths) {
  const tuple = nodePoseProperties[nodePath];
  if (!tuple || tuple.minItems !== 3 || tuple.maxItems !== 3) {
    throw new Error(`Schema missing XYZ tuple for node path ${nodePath}`);
  }
}

const trajectoryItem = frameSchema.properties.trajectory?.items;
if (!trajectoryItem?.properties?.position || !trajectoryItem?.properties?.direction) {
  throw new Error("Schema is missing frame trajectory properties");
}

for (const field of ["position", "direction"]) {
  const tuple = trajectoryItem.properties[field];
  if (!tuple || tuple.minItems !== 2 || tuple.maxItems !== 2) {
    throw new Error(`Schema missing XZ tuple for trajectory ${field}`);
  }
}

for (const state of expectedStates) {
  if (!frameSchema.properties.state.enum.includes(state)) {
    throw new Error(`Schema frame state enum missing ${state}`);
  }
}

console.log(
  JSON.stringify(
    {
      schema: schema.properties.schema.const,
      contractSchema: extension.contractSchema,
      states: expectedStates.length,
      controls: expectedControls.length,
      phaseChannels: expectedPhaseChannels.length,
      trajectorySamples: expectedTrajectorySampleTimes.length,
      joints: expectedJoints.length,
      nodePaths: expectedNodePaths.length,
    },
    null,
    2,
  ),
);
