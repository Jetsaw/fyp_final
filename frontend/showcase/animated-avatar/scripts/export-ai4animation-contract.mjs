import fs from "node:fs";
import path from "node:path";
import {
  JOINT_CONTROLS,
  MOTION_CLIPS,
  STATE_INTENTS,
} from "../src/components/ebeeRigController.ts";

const avatarDir = path.resolve("public/avatar/ebee_new");
const rigMapPath = path.join(avatarDir, "ebee_rig_map.json");
const outputPath = path.join(avatarDir, "ebee_ai4animation_contract.json");

if (!fs.existsSync(rigMapPath)) {
  throw new Error("Missing Ebee rig map. Run npm run avatar:rig:export first.");
}

const rigMap = JSON.parse(fs.readFileSync(rigMapPath, "utf8"));
const states = Object.keys(MOTION_CLIPS);
const controls = ["facing", "energy", "gesture", "attention", "step"];
const phaseChannels = ["spine", "head", "arms", "legs", "wings", "tail"];
const controllableNodesByPath = new Map();
for (const [group, nodes] of Object.entries(rigMap.groups ?? {})) {
  for (const node of nodes) {
    if (!controllableNodesByPath.has(node.path)) {
      controllableNodesByPath.set(node.path, {
        group,
        groups: [group],
        name: node.name,
        path: node.path,
        type: node.type,
      });
    } else {
      const existing = controllableNodesByPath.get(node.path);
      if (!existing.groups.includes(group)) existing.groups.push(group);
    }
  }
}
const controllableNodes = [...controllableNodesByPath.values()].sort((a, b) => a.path.localeCompare(b.path));

const contract = {
  schema: "hive-ebee-ai4animation-contract/v1",
  source: "sebastianstarke/AI4Animation",
  generatedBy: "scripts/export-ai4animation-contract.mjs",
  runtimeModel: {
    name: "Ebee",
    modelPath: "ebee_new.fbx",
    rigMapPath: "ebee_rig_map.json",
    controllableNodeCount: rigMap.controllableNodeCount,
    visibleAvatarMeshCount: rigMap.visibleAvatarMeshCount,
  },
  runtimeMotionDatabase: {
    schema: "hive-ebee-motion-database/v1",
    importer: "scripts/import-ai4animation-motion.mjs",
    verifier: "scripts/verify-ai4animation-runtime.mjs",
  },
  ai4animationExportSchema: {
    schema: "ai4animation-motion-export/v1",
    acceptedTopLevel: ["frames", "clips"],
    requiredFrameFields: ["state", "time", "joints"],
    acceptedPoseFields: ["joints", "pose", "rotations"],
    acceptedNodePoseFields: ["nodePose", "nodes", "fineJoints", "feature.nodePose"],
    acceptedControlFields: ["controls", "intent", "feature"],
    acceptedPhaseFields: ["localPhases", "phases", "feature.phases"],
    acceptedTrajectoryFields: ["trajectory", "feature.trajectory"],
  },
  trajectory: {
    semantic: "short horizon local-space path samples used by AI4Animation-style motion matching and control",
    sampleTimes: [-0.25, 0, 0.35, 0.7, 1.05],
    requiredFields: ["time", "position", "direction"],
    position: "XZ tuple in local avatar space",
    direction: "XZ unit-ish facing vector in local avatar space",
  },
  states: Object.fromEntries(
    states.map((state) => [
      state,
      {
        clip: MOTION_CLIPS[state].name,
        duration: MOTION_CLIPS[state].duration,
        defaultIntent: STATE_INTENTS[state],
      },
    ]),
  ),
  controls: Object.fromEntries(
    controls.map((control) => [
      control,
      {
        type: "number",
        finite: true,
        semantic: {
          facing: "horizontal body/head orientation control",
          energy: "motion amplitude and wing/tail activity control",
          gesture: "arm, hand, and expressive pose control",
          attention: "head/chest focus and lean control",
          step: "leg and foot gait phase control",
        }[control],
      },
    ]),
  ),
  phaseChannels: Object.fromEntries(
    phaseChannels.map((channel) => [
      channel,
      {
        requiredFields: ["sin", "cos", "amplitude"],
        finite: true,
      },
    ]),
  ),
  jointGroups: Object.fromEntries(
    JOINT_CONTROLS.map((joint) => [
      joint,
      {
        output: "XYZ Euler rotation tuple in radians",
        controllableNodeCount: rigMap.counts?.[joint] ?? 0,
        sampleNodePaths: (rigMap.groups?.[joint] ?? []).slice(0, 5).map((node) => node.path),
      },
    ]),
  ),
  controllableNodes,
  outputFrameExample: {
    state: "SPEAKING",
    time: 0.18,
    controls: STATE_INTENTS.SPEAKING,
    localPhases: {
      spine: { sin: 0, cos: 1, amplitude: 1 },
      head: { sin: 0, cos: 1, amplitude: 1 },
      arms: { sin: 0, cos: 1, amplitude: 1 },
      legs: { sin: 0, cos: 1, amplitude: 1 },
      wings: { sin: 0, cos: 1, amplitude: 1 },
      tail: { sin: 0, cos: 1, amplitude: 1 },
    },
    trajectory: [
      { time: -0.25, position: [0, 0], direction: [0, 1] },
      { time: 0, position: [0, 0], direction: [0, 1] },
      { time: 0.35, position: [0.04, 0.09], direction: [0.12, 0.99] },
      { time: 0.7, position: [0.08, 0.19], direction: [0.16, 0.99] },
      { time: 1.05, position: [0.12, 0.29], direction: [0.2, 0.98] },
    ],
    joints: {
      head: [-0.03, 0.08, 0.02],
      shoulderR: [-0.02, 0.03, 0.22],
      elbowR: [0.03, -0.01, 0.2],
      wristR: [0.08, -0.04, 0.14],
    },
    nodePose: {
      "Group/Main/FitSkeleton/Root/Spine1/Chest/Neck/Head": [-0.03, 0.08, 0.02],
      "Group/Main/MotionSystem/FKSystem/FKParentConstraintToScapula_R/FKOffsetShoulder_R/FKExtraShoulder_R/FKShoulder_R/FKXShoulder_R/FKOffsetElbow_R/FKExtraElbow_R/FKElbow_R/FKXElbow_R/FKOffsetWrist_R/FKExtraWrist_R/FKWrist_R/FKXWrist_R": [0.08, -0.04, 0.14],
    },
  },
};

fs.writeFileSync(outputPath, `${JSON.stringify(contract, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      outputPath,
      schema: contract.schema,
      states: states.length,
      controls: controls.length,
      jointGroups: Object.keys(contract.jointGroups).length,
      controllableNodes: contract.controllableNodes.length,
      controllableNodeCount: contract.runtimeModel.controllableNodeCount,
    },
    null,
    2,
  ),
);
