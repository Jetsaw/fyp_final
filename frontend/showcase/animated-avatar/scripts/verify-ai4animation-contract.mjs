import fs from "node:fs";
import path from "node:path";
import {
  JOINT_CONTROLS,
  MOTION_CLIPS,
  STATE_INTENTS,
} from "../src/components/ebeeRigController.ts";

const avatarDir = path.resolve("public/avatar/ebee_new");
const contractPath = path.join(avatarDir, "ebee_ai4animation_contract.json");
const rigMapPath = path.join(avatarDir, "ebee_rig_map.json");

if (!fs.existsSync(contractPath)) {
  throw new Error("Missing Ebee AI4Animation contract. Run npm run avatar:ai4animation:contract:export.");
}

const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const rigMap = JSON.parse(fs.readFileSync(rigMapPath, "utf8"));
const states = Object.keys(MOTION_CLIPS);
const controls = ["facing", "energy", "gesture", "attention", "step"];
const phaseChannels = ["spine", "head", "arms", "legs", "wings", "tail"];
const trajectorySampleTimes = [-0.25, 0, 0.35, 0.7, 1.05];

if (contract.schema !== "hive-ebee-ai4animation-contract/v1") {
  throw new Error(`Unexpected AI4Animation contract schema ${contract.schema}`);
}

if (contract.ai4animationExportSchema?.schema !== "ai4animation-motion-export/v1") {
  throw new Error(`Unexpected AI4Animation export schema ${contract.ai4animationExportSchema?.schema}`);
}

for (const scriptPath of [contract.runtimeMotionDatabase?.importer, contract.runtimeMotionDatabase?.verifier]) {
  if (!scriptPath || !fs.existsSync(path.resolve(scriptPath))) {
    throw new Error(`Contract references missing script ${scriptPath}`);
  }
}

if (contract.runtimeModel?.controllableNodeCount !== rigMap.controllableNodeCount) {
  throw new Error(
    `Contract node count mismatch: ${contract.runtimeModel?.controllableNodeCount} !== ${rigMap.controllableNodeCount}`,
  );
}

for (const state of states) {
  const contractState = contract.states?.[state];
  if (!contractState) {
    throw new Error(`Contract missing state ${state}`);
  }

  if (contractState.clip !== MOTION_CLIPS[state].name) {
    throw new Error(`Contract clip mismatch for ${state}: ${contractState.clip} !== ${MOTION_CLIPS[state].name}`);
  }

  for (const [key, value] of Object.entries(STATE_INTENTS[state])) {
    if (contractState.defaultIntent?.[key] !== value) {
      throw new Error(`Contract intent mismatch for ${state}.${key}`);
    }
  }
}

for (const control of controls) {
  if (!contract.controls?.[control]?.finite) {
    throw new Error(`Contract missing finite control ${control}`);
  }
}

for (const channel of phaseChannels) {
  const contractChannel = contract.phaseChannels?.[channel];
  if (!contractChannel?.finite || contractChannel.requiredFields?.join(",") !== "sin,cos,amplitude") {
    throw new Error(`Contract missing phase channel ${channel}`);
  }
}

if (contract.ai4animationExportSchema?.acceptedTrajectoryFields?.join(",") !== "trajectory,feature.trajectory") {
  throw new Error("Contract is missing accepted trajectory fields");
}

if (contract.ai4animationExportSchema?.acceptedNodePoseFields?.join(",") !== "nodePose,nodes,fineJoints,feature.nodePose") {
  throw new Error("Contract is missing accepted node pose fields");
}

if (contract.trajectory?.sampleTimes?.join(",") !== trajectorySampleTimes.join(",")) {
  throw new Error(`Contract trajectory sample times mismatch: ${contract.trajectory?.sampleTimes}`);
}

if (contract.trajectory?.requiredFields?.join(",") !== "time,position,direction") {
  throw new Error("Contract trajectory required fields mismatch");
}

for (const joint of JOINT_CONTROLS) {
  const group = contract.jointGroups?.[joint];
  if (!group) {
    throw new Error(`Contract missing joint group ${joint}`);
  }

  if (group.controllableNodeCount !== rigMap.counts?.[joint]) {
    throw new Error(`Contract group count mismatch for ${joint}: ${group.controllableNodeCount} !== ${rigMap.counts?.[joint]}`);
  }

  if (group.controllableNodeCount <= 0) {
    throw new Error(`Contract group ${joint} has no controllable nodes`);
  }
}

if (!Array.isArray(contract.controllableNodes) || contract.controllableNodes.length !== rigMap.controllableNodeCount) {
  throw new Error(`Contract controllable node list mismatch: ${contract.controllableNodes?.length} !== ${rigMap.controllableNodeCount}`);
}

const rigNodePaths = new Set(Object.values(rigMap.groups ?? {}).flatMap((nodes) => nodes.map((node) => node.path)));
for (const node of contract.controllableNodes) {
  if (!rigNodePaths.has(node.path)) {
    throw new Error(`Contract includes unknown controllable node ${node.path}`);
  }
}

console.log(
  JSON.stringify(
    {
      schema: contract.schema,
      exportSchema: contract.ai4animationExportSchema.schema,
      states: states.length,
      controls: controls.length,
      phaseChannels: phaseChannels.length,
      trajectorySamples: trajectorySampleTimes.length,
      jointGroups: JOINT_CONTROLS.length,
      controllableNodes: contract.controllableNodes.length,
      controllableNodeCount: contract.runtimeModel.controllableNodeCount,
    },
    null,
    2,
  ),
);
