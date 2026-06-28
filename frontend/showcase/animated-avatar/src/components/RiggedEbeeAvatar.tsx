import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { TGALoader } from "three/examples/jsm/loaders/TGALoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";
import {
  JOINT_CONTROLS,
  RIG_POSE_PRESETS,
  STATE_INTENTS,
  normalizeMotionDatabase,
  sampleMotionFrame,
  type JointKey,
  type ManualPose,
  type MotionDatabasePayload,
  type MotionFrame,
  type MotionIntent,
  type RiggedEbeeState,
  type RigPose,
} from "./ebeeRigController";
import "./Avatar3D.css";
export type { RiggedEbeeState } from "./ebeeRigController";

type Props = {
  state: RiggedEbeeState;
  debug?: boolean;
  behavior?: AvatarBehavior;
  speechPulse?: number;
};

type AvatarBehavior = "idle" | "greeting" | "speaking" | "listening";
type RigGroup = Record<JointKey, THREE.Object3D[]>;
type FacialJointKey = "eyeL" | "eyeR" | "upperTeeth" | "lowerTeeth" | "tongue";
type FacialRigGroup = Record<FacialJointKey, THREE.Object3D[]>;

type RigCounts = Record<JointKey, number>;
type RigNodePose = Record<string, [number, number, number]>;
type RestRotationMap = Map<THREE.Object3D, [number, number, number]>;
type RigNode = {
  id: string;
  label: string;
  group: JointKey;
  name: string;
};
type RigMeta = {
  counts: RigCounts;
  nodes: RigNode[];
};
type AvatarManifestPayload = {
  schema: string;
  motionDatabase?: {
    path?: string;
    frameCount?: number;
    source?: string;
    sourceSchema?: string | null;
    runtimeMotionDatabase?: boolean;
  };
  rigMap?: {
    path?: string;
    controllableNodeCount?: number;
  };
  ai4AnimationContract?: {
    path?: string;
    exportSchema?: string;
    jointGroups?: number;
  };
};
type RigMapPayload = {
  schema: string;
  controllableNodeCount?: number;
};
type Ai4AnimationContractPayload = {
  schema: string;
  ai4animationExportSchema?: {
    schema?: string;
  };
  jointGroups?: Record<string, unknown>;
};

const stateLabels: Record<RiggedEbeeState, string> = {
  READY: "Ready",
  LISTENING: "Listening",
  THINKING: "Checking",
  SPEAKING: "Speaking",
  NEEDS_REVIEW: "Review",
};

const ASSET_URL = "/avatar/ebee_new/ebee_new.fbx";
const AVATAR_BASE_URL = "/avatar/ebee_new/";
const AVATAR_MANIFEST_URL = `${AVATAR_BASE_URL}ebee_avatar_manifest.json`;
const MOTION_DATABASE_URL = "/avatar/ebee_new/ebee_motion_database.json";
const TEX = "/avatar/ebee_new/sourceimages/";
const EMPTY_RIG_NODES: RigNode[] = [];
const RESTING_ARM_POSE: ManualPose = {
  shoulderL: [0, 0, 0],
  shoulderR: [0, 0, 0],
};
const CALM_REST_ARM_POSE: ManualPose = {
  ...RESTING_ARM_POSE,
  elbowL: [0, 0, 0],
  elbowR: [0, 0, 0],
  wristL: [0, 0, 0],
  wristR: [0, 0, 0],
  fingersL: [0, 0, 0],
  fingersR: [0, 0, 0],
};
const BEHAVIOR_TRANSITION_SECONDS = 0.55;
const PROTECTED_BODY_JOINTS = [
  "root",
  "hipL",
  "hipR",
  "kneeL",
  "kneeR",
  "ankleL",
  "ankleR",
  "toesL",
  "toesR",
] as const satisfies readonly JointKey[];
const PROTECTED_NODE_PATH_PATTERN = /(?:^|\/)(?:FitSkeleton\/Root|FKX?Root_M|Root|Pelvis|FKX?Hip_[LR]|Hip_[LR]|FKX?Knee_[LR]|Knee_[LR]|FKX?Ankle_[LR]|Ankle_[LR]|FKToes_[LR]|Toes_[LR])(?:$|\/)/i;
const EMPTY_FACIAL_RIG: FacialRigGroup = {
  eyeL: [],
  eyeR: [],
  upperTeeth: [],
  lowerTeeth: [],
  tongue: [],
};

function parseDebugManualPose(): ManualPose {
  if (typeof window === "undefined") return {};

  const raw = new URLSearchParams(window.location.search).get("avatarPose");
  if (!raw) return {};

  const pose: ManualPose = {};
  const jointSet = new Set<string>(JOINT_CONTROLS);

  for (const segment of raw.split(";")) {
    const [joint, value] = segment.split("=");
    const values = value?.split(",").map((item) => Number(item.trim()));
    if (!jointSet.has(joint) || !values || values.length !== 3 || values.some((item) => !Number.isFinite(item))) {
      continue;
    }
    pose[joint as JointKey] = [values[0], values[1], values[2]];
  }

  return pose;
}

function objectPath(object: THREE.Object3D) {
  const parts: string[] = [];
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current.name) parts.push(current.name);
    current = current.parent;
  }
  return parts.reverse().join("/");
}

function findAll(root: THREE.Object3D, pattern: RegExp) {
  const matches: THREE.Object3D[] = [];
  root.traverse((object) => {
    if (pattern.test(objectPath(object))) matches.push(object);
  });
  return matches;
}

function dampRotation(
  objects: THREE.Object3D[],
  target: [number, number, number],
  delta: number,
  speed = 9,
) {
  for (const object of objects) {
    object.rotation.x = THREE.MathUtils.damp(object.rotation.x, target[0], speed, delta);
    object.rotation.y = THREE.MathUtils.damp(object.rotation.y, target[1], speed, delta);
    object.rotation.z = THREE.MathUtils.damp(object.rotation.z, target[2], speed, delta);
  }
}

function applyColorTextureSettings(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
}

function applyDataTextureSettings(texture: THREE.Texture) {
  texture.anisotropy = 4;
  texture.needsUpdate = true;
}

function makeMaterial(options: THREE.MeshStandardMaterialParameters) {
  return new THREE.MeshStandardMaterial({
    roughness: 0.36,
    metalness: 0.12,
    ...options,
  });
}

function buildRig(root: THREE.Object3D): RigGroup {
  return {
    root: findAll(root, /(?:FitSkeleton\/Root$|FKRoot_M$|FKXRoot_M$)/),
    spine: findAll(root, /(?:Spine1$|FKSpine1_M$|FKXSpine1_M$)/),
    chest: findAll(root, /(?:Chest$|FKChest_M$|FKXChest_M$)/),
    neck: findAll(root, /(?:Neck$|FKNeck_M$|FKXNeck_M$)/),
    head: findAll(root, /(?:Head$|FKHead_M$|FKXHead_M$)/),
    facePlate: findAll(root, /(?:facePlate|Faceplate)/i),
    antenna: findAll(root, /(?:headTip|Anthenna|Antenna)/i),
    shoulderL: findAll(root, /(?:FKShoulder_L|FKXShoulder_L|Shoulder_L)/),
    shoulderR: findAll(root, /(?:FKShoulder_R|FKXShoulder_R|Shoulder_R)/),
    elbowL: findAll(root, /(?:FKElbow_L|FKXElbow_L|Elbow_L)/),
    elbowR: findAll(root, /(?:FKElbow_R|FKXElbow_R|Elbow_R)/),
    wristL: findAll(root, /(?:FKWrist_L|FKXWrist_L|Wrist_L|FKCup_L|FKXCup_L)/),
    wristR: findAll(root, /(?:FKWrist_R|FKXWrist_R|Wrist_R|FKCup_R|FKXCup_R)/),
    fingersL: findAll(root, /(?:Finger\d_L|FKX.*Finger\d_L|FK.*Finger\d_L)/),
    fingersR: findAll(root, /(?:Finger\d_R|FKX.*Finger\d_R|FK.*Finger\d_R)/),
    hipL: findAll(root, /(?:FKHip_L|FKXHip_L|Hip_L)/),
    hipR: findAll(root, /(?:FKHip_R|FKXHip_R|Hip_R)/),
    kneeL: findAll(root, /(?:FKKnee_L|FKXKnee_L|Knee_L)/),
    kneeR: findAll(root, /(?:FKKnee_R|FKXKnee_R|Knee_R)/),
    ankleL: findAll(root, /(?:FKAnkle_L|FKXAnkle_L|Ankle_L)/),
    ankleR: findAll(root, /(?:FKAnkle_R|FKXAnkle_R|Ankle_R)/),
    toesL: findAll(root, /(?:FKToes_L|Toes_L)/),
    toesR: findAll(root, /(?:FKToes_R|Toes_R)/),
    wingL: findAll(root, /(?:FKwing\d_L|FKXwing\d_L|wing\d_L)/),
    wingR: findAll(root, /(?:FKwing\d_R|FKXwing\d_R|wing\d_R)/),
    tail: findAll(root, /(?:FKtail|tail\d)/),
  };
}

function buildFacialRig(root: THREE.Object3D): FacialRigGroup {
  return {
    eyeL: findAll(root, /(?:FaceDeformationSystemFollowHead\/Eye_L$|\/Eye_L$)/),
    eyeR: findAll(root, /(?:FaceDeformationSystemFollowHead\/Eye_R$|\/Eye_R$)/),
    upperTeeth: findAll(root, /(?:\/upperTeethJoint_M$)/),
    lowerTeeth: findAll(root, /(?:\/lowerTeethJoint_M$)/),
    tongue: findAll(root, /(?:\/Tongue\dJoint_M$)/),
  };
}

function getRigCounts(rig: RigGroup): RigCounts {
  return JOINT_CONTROLS.reduce((counts, key) => {
    counts[key] = rig[key].length;
    return counts;
  }, {} as RigCounts);
}

function getRigNodes(rig: RigGroup): RigNode[] {
  const seen = new Set<string>();
  const nodes: RigNode[] = [];

  for (const group of JOINT_CONTROLS) {
    for (const object of rig[group]) {
      const id = objectPath(object);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      nodes.push({
        id,
        label: `${group}: ${object.name || "joint"}`,
        group,
        name: object.name || "joint",
      });
    }
  }

  return nodes.sort((a, b) => a.label.localeCompare(b.label));
}

function getRigNodeMap(rig: RigGroup): Map<string, THREE.Object3D> {
  const nodeMap = new Map<string, THREE.Object3D>();

  for (const group of JOINT_CONTROLS) {
    for (const object of rig[group]) {
      const id = objectPath(object);
      if (id && !nodeMap.has(id)) nodeMap.set(id, object);
    }
  }

  return nodeMap;
}

function applyManualPose(rig: RigGroup, manualPose: ManualPose, delta: number, smoothSpeed: number) {
  for (const [key, target] of Object.entries(manualPose) as [JointKey, [number, number, number]][]) {
    if (!target) continue;
    dampRotation(rig[key], target, delta, 12 * smoothSpeed);
  }
}

function applyNodeManualPose(nodeMap: Map<string, THREE.Object3D>, nodePose: RigNodePose, delta: number, smoothSpeed: number) {
  for (const [id, target] of Object.entries(nodePose)) {
    if (PROTECTED_NODE_PATH_PATTERN.test(id)) continue;
    const object = nodeMap.get(id);
    if (!object) continue;
    dampRotation([object], target, delta, 14 * smoothSpeed);
  }
}

function applyRigPose(rig: RigGroup, pose: RigPose, delta: number, smoothSpeed: number) {
  for (const key of JOINT_CONTROLS) {
    if ((PROTECTED_BODY_JOINTS as readonly JointKey[]).includes(key)) continue;
    const target = pose[key];
    if (!target) continue;
    dampRotation(rig[key], target, delta, 10 * smoothSpeed);
  }
}

function captureRestRotations(rig: RigGroup): RestRotationMap {
  const restRotations: RestRotationMap = new Map();

  for (const key of PROTECTED_BODY_JOINTS) {
    for (const object of rig[key]) {
      restRotations.set(object, [object.rotation.x, object.rotation.y, object.rotation.z]);
    }
  }

  return restRotations;
}

function restoreProtectedBodyPose(restRotations: RestRotationMap) {
  for (const [object, restRotation] of restRotations) {
    object.rotation.set(restRotation[0], restRotation[1], restRotation[2]);
  }
}

function getDefaultBehavior(state: RiggedEbeeState): AvatarBehavior {
  if (state === "LISTENING" || state === "THINKING") return "listening";
  if (state === "SPEAKING") return "speaking";
  return "idle";
}

function getControlledBehaviorPose(behavior: AvatarBehavior, t: number, transition: number): RigPose {
  const breath = Math.sin(t * 1.6);
  const headNod = Math.sin(t * 1.05);
  const headTurn = Math.sin(t * 0.62 + 0.6);
  const leftGesture = Math.max(0, Math.sin(t * 1.85 + 0.35));
  const rightGesture = Math.max(0, Math.sin(t * 1.85 + Math.PI + 0.35));
  const talk = Math.sin(t * 10.5);
  const greetingProgress = THREE.MathUtils.clamp(transition, 0, 1);
  const greetingWave = Math.sin(greetingProgress * Math.PI * 4) * Math.sin(greetingProgress * Math.PI);
  const greetingHold = THREE.MathUtils.smoothstep(greetingProgress, 0, 1);
  const greetingSettle = Math.sin(greetingProgress * Math.PI);

  const idle: RigPose = {
    ...CALM_REST_ARM_POSE,
    spine: [breath * 0.002, 0, 0],
    chest: [breath * 0.004, headTurn * 0.002, 0],
    neck: [0.015 + headNod * 0.005, headTurn * 0.008, -headTurn * 0.003],
    head: [0.015 + headNod * 0.008, headTurn * 0.014, -headTurn * 0.004],
  };

  if (behavior === "listening") {
    return {
      ...idle,
      spine: [-0.006 + breath * 0.002, 0, 0],
      chest: [-0.012 + breath * 0.003, headTurn * 0.004, 0],
      neck: [0.024 + headNod * 0.004, headTurn * 0.01, -headTurn * 0.003],
      head: [-0.012 + headNod * 0.007, headTurn * 0.018, -headTurn * 0.004],
    };
  }

  if (behavior === "speaking") {
    return {
      ...idle,
      spine: [breath * 0.003, 0, 0],
      chest: [0.004 + breath * 0.004, headTurn * 0.006, 0],
      neck: [0.014 + headNod * 0.008, headTurn * 0.014, -headTurn * 0.004],
      head: [0.012 + headNod * 0.014, headTurn * 0.022, Math.sin(t * 1.1) * 0.005],
      facePlate: [talk * 0.016, 0, 0],
      shoulderL: RESTING_ARM_POSE.shoulderL,
      elbowL: [leftGesture * 0.008, 0, -leftGesture * 0.012],
      wristL: [Math.sin(t * 2.4) * 0.006, leftGesture * 0.008, -leftGesture * 0.012],
      fingersL: [0.025 + leftGesture * 0.018, 0, 0.006],
      shoulderR: RESTING_ARM_POSE.shoulderR,
      elbowR: [rightGesture * 0.008, 0, rightGesture * 0.012],
      wristR: [Math.sin(t * 2.4 + Math.PI) * 0.006, -rightGesture * 0.008, rightGesture * 0.012],
      fingersR: [0.025 + rightGesture * 0.018, 0, 0.006],
    };
  }

  if (behavior === "greeting") {
    return {
      ...idle,
      spine: [-0.012 + breath * 0.002, -0.012 * greetingHold, 0.035 * greetingHold],
      chest: [0.018 + breath * 0.004, -0.035 * greetingHold, 0.055 * greetingHold],
      neck: [0.012 + headNod * 0.004, -0.035 * greetingHold, -0.035 * greetingHold],
      head: [0.006 + headNod * 0.006, -0.055 * greetingHold, -0.075 * greetingHold],
      shoulderL: [2.05, -0.18, 0.22 + greetingWave * 0.03],
      elbowL: [0.08, 0.04, 0.3 + greetingWave * 0.035],
      wristL: [0.04, 0.22 + greetingWave * 0.05, 0.28 + greetingWave * 0.05],
      fingersL: [0.01, 0, -0.22 - greetingSettle * 0.08],
      shoulderR: [0.2, 0.4, -0.52],
      elbowR: [0.08, 0.04, -0.42],
      wristR: [0.18, -0.08, -0.26],
      fingersR: [0.12, 0, 0.04],
    };
  }

  return idle;
}

function getFinalBehaviorOverride(behavior: AvatarBehavior): ManualPose {
  if (behavior === "speaking") {
    return RESTING_ARM_POSE;
  }

  if (behavior === "idle" || behavior === "listening") {
    return CALM_REST_ARM_POSE;
  }

  return {};
}

function getBlinkAmount(t: number) {
  const blinkPhase = t % 5.2;
  const primaryBlink = 1 - THREE.MathUtils.smoothstep(Math.abs(blinkPhase - 0.12), 0.02, 0.12);
  const secondaryPhase = (t + 2.7) % 7.4;
  const secondaryBlink = 1 - THREE.MathUtils.smoothstep(Math.abs(secondaryPhase - 0.1), 0.02, 0.1);
  return THREE.MathUtils.clamp(Math.max(primaryBlink, secondaryBlink), 0, 1);
}

function applyEyeLightBehavior(eyeMaterials: THREE.MeshStandardMaterial[], behavior: AvatarBehavior, blink: number, delta: number) {
  const activeBoost = behavior === "speaking" || behavior === "greeting" ? 0.025 : 0;
  const targetIntensity = 0.055 + activeBoost - blink * 0.025;

  for (const material of eyeMaterials) {
    material.emissiveIntensity = THREE.MathUtils.damp(material.emissiveIntensity, targetIntensity, 18, delta);
  }
}

function applyFacialBehavior(
  facialRig: FacialRigGroup,
  eyeMaterials: THREE.MeshStandardMaterial[],
  behavior: AvatarBehavior,
  speechPulse: number,
  t: number,
  transition: number,
  delta: number,
  smoothSpeed: number,
) {
  const proceduralTalk = behavior === "speaking" ? Math.max(0, Math.sin(t * 10.5)) * 0.35 : 0;
  const talk = behavior === "speaking" ? Math.max(proceduralTalk, speechPulse) : 0;
  const greetingSmile = behavior === "greeting" ? Math.sin(transition * Math.PI) * 0.35 : 0;
  const blink = getBlinkAmount(t);
  const mouthOpen = talk * 0.14 + greetingSmile * 0.025;

  applyEyeLightBehavior(eyeMaterials, behavior, blink, delta);
  dampRotation(facialRig.eyeL, [0, 0, 0], delta, 14 * smoothSpeed);
  dampRotation(facialRig.eyeR, [0, 0, 0], delta, 14 * smoothSpeed);
  dampRotation(facialRig.upperTeeth, [-mouthOpen * 0.18, 0, 0], delta, 14 * smoothSpeed);
  dampRotation(facialRig.lowerTeeth, [mouthOpen, 0, 0], delta, 14 * smoothSpeed);
  dampRotation(facialRig.tongue, [mouthOpen * 0.35 + Math.sin(t * 12.5) * talk * 0.04, 0, 0], delta, 14 * smoothSpeed);
}

function RiggedModel({
  state,
  behavior,
  speechPulse = 0,
  manualPose,
  nodePose,
  intent,
  motionDatabase,
  databaseWeight,
  smoothSpeed,
  onRigMeta,
}: Props & {
  behavior: AvatarBehavior;
  speechPulse: number;
  manualPose: ManualPose;
  nodePose: RigNodePose;
  intent: MotionIntent;
  motionDatabase: MotionFrame[];
  databaseWeight: number;
  smoothSpeed: number;
  onRigMeta: (meta: RigMeta) => void;
}) {
  const source = useLoader(FBXLoader, ASSET_URL);
  const bodyTexture = useLoader(THREE.TextureLoader, `${TEX}Body_dif.png`);
  const bodyMetalnessTexture = useLoader(THREE.TextureLoader, `${TEX}Body_met.png`);
  const bodyNormalTexture = useLoader(THREE.TextureLoader, `${TEX}Body_nor.png`);
  const bodyRoughnessTexture = useLoader(THREE.TextureLoader, `${TEX}Body_rou.png`);
  const jacketTexture = useLoader(THREE.TextureLoader, `${TEX}Jacket_dif.png`);
  const jacketMetalnessTexture = useLoader(THREE.TextureLoader, `${TEX}Jacket_met.png`);
  const jacketNormalTexture = useLoader(THREE.TextureLoader, `${TEX}Jacket_nor.png`);
  const jacketRoughnessTexture = useLoader(THREE.TextureLoader, `${TEX}Jacket_rou.png`);
  const armorTexture = useLoader(THREE.TextureLoader, `${TEX}UppArmor_dif.png`);
  const armorMetalnessTexture = useLoader(THREE.TextureLoader, `${TEX}UppArmor_met.png`);
  const armorNormalTexture = useLoader(THREE.TextureLoader, `${TEX}UppArmor_nor.png`);
  const armorRoughnessTexture = useLoader(THREE.TextureLoader, `${TEX}UppArmor_rou.png`);
  const lowerArmorTexture = useLoader(THREE.TextureLoader, `${TEX}BtmArmor_dif.png`);
  const lowerArmorMetalnessTexture = useLoader(THREE.TextureLoader, `${TEX}BtmArmor_met.png`);
  const lowerArmorNormalTexture = useLoader(THREE.TextureLoader, `${TEX}BtmArmor_nor.png`);
  const lowerArmorRoughnessTexture = useLoader(THREE.TextureLoader, `${TEX}BtmArmor_rou.png`);
  const buttTexture = useLoader(THREE.TextureLoader, `${TEX}Butt_dif.png`);
  const buttMetalnessTexture = useLoader(THREE.TextureLoader, `${TEX}Butt_met.png`);
  const buttNormalTexture = useLoader(THREE.TextureLoader, `${TEX}Butt_nor.png`);
  const buttRoughnessTexture = useLoader(THREE.TextureLoader, `${TEX}Butt_rou.png`);
  const faceTexture = useLoader(THREE.TextureLoader, `${TEX}Face_dif.png`);
  const faceAltTexture = useLoader(THREE.TextureLoader, `${TEX}Face01_dif.png`);
  const facePlateTexture = useLoader(TGALoader, `${TEX}faceplate_Diffuse.tga`);
  const helmetTexture = useLoader(TGALoader, `${TEX}helmet_Diffuse_new.tga`);
  const helmetRoughnessTexture = useLoader(THREE.TextureLoader, `${TEX}helmet_Roughness_Baked.png`);
  const palmTexture = useLoader(THREE.TextureLoader, `${TEX}Palm_dif.png`);
  const palmMetalnessTexture = useLoader(THREE.TextureLoader, `${TEX}Palm_met.png`);
  const palmNormalTexture = useLoader(THREE.TextureLoader, `${TEX}Palm_nor.png`);
  const palmRoughnessTexture = useLoader(THREE.TextureLoader, `${TEX}Palm_rou.png`);
  const handTexture = useLoader(THREE.TextureLoader, `${TEX}Hand_dif.png`);
  const handMetalnessTexture = useLoader(THREE.TextureLoader, `${TEX}Hand_met.png`);
  const handNormalTexture = useLoader(THREE.TextureLoader, `${TEX}Hand_nor.png`);
  const handRoughnessTexture = useLoader(THREE.TextureLoader, `${TEX}Hand_rou.png`);
  const legTexture = useLoader(THREE.TextureLoader, `${TEX}Leg_dif.png`);
  const legMetalnessTexture = useLoader(THREE.TextureLoader, `${TEX}Leg_met.png`);
  const legNormalTexture = useLoader(THREE.TextureLoader, `${TEX}Leg_nor.png`);
  const legRoughnessTexture = useLoader(THREE.TextureLoader, `${TEX}Leg_rou.png`);
  const shoesTexture = useLoader(THREE.TextureLoader, `${TEX}Shoes_dif.png`);
  const shoesMetalnessTexture = useLoader(THREE.TextureLoader, `${TEX}Shoes_met.png`);
  const shoesNormalTexture = useLoader(THREE.TextureLoader, `${TEX}Shoes_nor.png`);
  const shoesRoughnessTexture = useLoader(THREE.TextureLoader, `${TEX}Shoes_rou.png`);
  const wingTexture = useLoader(THREE.TextureLoader, `${TEX}wing_CircuitTest_V4.png`);
  const wingDiffuseTexture = useLoader(TGALoader, `${TEX}wing_Diffuse.tga`);
  const eyeTexture = useLoader(THREE.TextureLoader, `${TEX}Eyegreen.jpg`);
  const innerEarTexture = useLoader(TGALoader, `${TEX}iin_ear_Diffuse.tga`);
  const outerEarTexture = useLoader(TGALoader, `${TEX}out_ear_Diffuse_new.tga`);
  const sideburnTexture = useLoader(TGALoader, `${TEX}sideburns_Diffuse.tga`);
  const modelRef = useRef<THREE.Group>(null);
  const rigRef = useRef<RigGroup | null>(null);
  const facialRigRef = useRef<FacialRigGroup>(EMPTY_FACIAL_RIG);
  const eyeMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const nodeMapRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const protectedRestRotationsRef = useRef<RestRotationMap>(new Map());
  const previousStateRef = useRef<RiggedEbeeState>(state);
  const previousBehaviorRef = useRef<AvatarBehavior>(behavior);
  const transitionStartRef = useRef(0);

  const model = useMemo(() => clone(source) as THREE.Group, [source]);

  useEffect(() => {
    const textures = [
      bodyTexture,
      bodyMetalnessTexture,
      bodyNormalTexture,
      bodyRoughnessTexture,
      jacketTexture,
      jacketMetalnessTexture,
      jacketNormalTexture,
      jacketRoughnessTexture,
      armorTexture,
      armorMetalnessTexture,
      armorNormalTexture,
      armorRoughnessTexture,
      lowerArmorTexture,
      lowerArmorMetalnessTexture,
      lowerArmorNormalTexture,
      lowerArmorRoughnessTexture,
      buttTexture,
      buttMetalnessTexture,
      buttNormalTexture,
      buttRoughnessTexture,
      faceTexture,
      faceAltTexture,
      facePlateTexture,
      helmetTexture,
      helmetRoughnessTexture,
      palmTexture,
      palmMetalnessTexture,
      palmNormalTexture,
      palmRoughnessTexture,
      handTexture,
      handMetalnessTexture,
      handNormalTexture,
      handRoughnessTexture,
      legTexture,
      legMetalnessTexture,
      legNormalTexture,
      legRoughnessTexture,
      shoesTexture,
      shoesMetalnessTexture,
      shoesNormalTexture,
      shoesRoughnessTexture,
      wingTexture,
      wingDiffuseTexture,
      eyeTexture,
      innerEarTexture,
      outerEarTexture,
      sideburnTexture,
    ];
    const colorTextures = [
      bodyTexture,
      jacketTexture,
      armorTexture,
      lowerArmorTexture,
      buttTexture,
      faceTexture,
      faceAltTexture,
      facePlateTexture,
      helmetTexture,
      palmTexture,
      handTexture,
      legTexture,
      shoesTexture,
      wingTexture,
      wingDiffuseTexture,
      eyeTexture,
      innerEarTexture,
      outerEarTexture,
      sideburnTexture,
    ];
    colorTextures.forEach(applyColorTextureSettings);
    textures.filter((texture) => !colorTextures.includes(texture)).forEach(applyDataTextureSettings);

    const materialByName = new Map<string, THREE.MeshStandardMaterial>([
      [
        "Ebee_Model_mod_Body_MT",
        makeMaterial({
          map: bodyTexture,
          normalMap: bodyNormalTexture,
          roughnessMap: bodyRoughnessTexture,
          metalnessMap: bodyMetalnessTexture,
          roughness: 0.42,
        }),
      ],
      [
        "Ebee_Model_mod_Jacket_MT",
        makeMaterial({
          map: jacketTexture,
          normalMap: jacketNormalTexture,
          roughnessMap: jacketRoughnessTexture,
          metalnessMap: jacketMetalnessTexture,
          roughness: 0.38,
          metalness: 0.18,
        }),
      ],
      [
        "Ebee_Model_mod_UppArmor_MT",
        makeMaterial({
          map: armorTexture,
          normalMap: armorNormalTexture,
          roughnessMap: armorRoughnessTexture,
          metalnessMap: armorMetalnessTexture,
          roughness: 0.34,
          metalness: 0.22,
        }),
      ],
      [
        "Ebee_Model_mod_BtmArmor_MT",
        makeMaterial({
          map: lowerArmorTexture,
          normalMap: lowerArmorNormalTexture,
          roughnessMap: lowerArmorRoughnessTexture,
          metalnessMap: lowerArmorMetalnessTexture,
          roughness: 0.34,
          metalness: 0.22,
        }),
      ],
      [
        "Ebee_Model_mod_Butt_MT",
        makeMaterial({
          map: buttTexture,
          normalMap: buttNormalTexture,
          roughnessMap: buttRoughnessTexture,
          metalnessMap: buttMetalnessTexture,
          roughness: 0.34,
          metalness: 0.18,
        }),
      ],
      ["Ebee_Model_mod_Face_MT", makeMaterial({ map: faceTexture, roughness: 0.3, metalness: 0.08 })],
      ["Ebee_Model_mod_Face_MT1", makeMaterial({ map: faceAltTexture, roughness: 0.3, metalness: 0.08 })],
      ["Ebee_Model_mod_Faceplate_MT", makeMaterial({ map: facePlateTexture, roughness: 0.22, metalness: 0.08 })],
      [
        "Ebee_Model_mod_Helmet_MT",
        makeMaterial({ map: helmetTexture, roughnessMap: helmetRoughnessTexture, roughness: 0.32, metalness: 0.2 }),
      ],
      [
        "Ebee_Model_mod_Eye_MT",
        makeMaterial({
          map: eyeTexture,
          color: "#ffffff",
          emissive: "#002f08",
          emissiveIntensity: 0.025,
          roughness: 0.16,
          metalness: 0.02,
        }),
      ],
      [
        "Ebee_Model_mod_Palm_MT",
        makeMaterial({
          map: palmTexture,
          normalMap: palmNormalTexture,
          roughnessMap: palmRoughnessTexture,
          metalnessMap: palmMetalnessTexture,
          roughness: 0.38,
          metalness: 0.08,
        }),
      ],
      [
        "Ebee_Model_mod_Hand_MT",
        makeMaterial({
          map: handTexture,
          normalMap: handNormalTexture,
          roughnessMap: handRoughnessTexture,
          metalnessMap: handMetalnessTexture,
          roughness: 0.34,
          metalness: 0.18,
        }),
      ],
      [
        "Ebee_Model_mod_Leg_MT",
        makeMaterial({
          map: legTexture,
          normalMap: legNormalTexture,
          roughnessMap: legRoughnessTexture,
          metalnessMap: legMetalnessTexture,
          roughness: 0.38,
          metalness: 0.16,
        }),
      ],
      [
        "Ebee_Model_mod_Shoes_MT",
        makeMaterial({
          map: shoesTexture,
          normalMap: shoesNormalTexture,
          roughnessMap: shoesRoughnessTexture,
          metalnessMap: shoesMetalnessTexture,
          roughness: 0.36,
          metalness: 0.18,
        }),
      ],
      [
        "Ebee_Model_mod_Wing_MT",
        makeMaterial({
          map: wingTexture,
          alphaMap: wingDiffuseTexture,
          transparent: true,
          opacity: 0.86,
          roughness: 0.24,
          metalness: 0.08,
        }),
      ],
      ["Ebee_Model_mod_Socket_MT", makeMaterial({ color: "#d9e4ef", roughness: 0.28, metalness: 0.16 })],
      ["Ebee_Model_mod_Joint_Mt", makeMaterial({ color: "#d8e1eb", roughness: 0.3, metalness: 0.18 })],
      ["Ebee_Model_mod_OuterEar_MT", makeMaterial({ map: outerEarTexture, roughness: 0.3, metalness: 0.18 })],
      ["Ebee_Model_mod_InnerEar_MT", makeMaterial({ map: innerEarTexture, roughness: 0.24, metalness: 0.08 })],
      ["Ebee_Model_mod_TopRed_MT", makeMaterial({ color: "#e11d2f", emissive: "#e11d2f", emissiveIntensity: 0.22 })],
      ["Ebee_Model_mod_TopGrey_MT", makeMaterial({ color: "#e8edf2", roughness: 0.3, metalness: 0.14 })],
      ["Ebee_Model_mod_TopBlue_MT", makeMaterial({ color: "#0b76d8", roughness: 0.26, metalness: 0.22 })],
      ["Ebee_Model_mod_RedLight_MT", makeMaterial({ color: "#ef233c", emissive: "#ef233c", emissiveIntensity: 0.35 })],
      ["Ebee_Model_mod_SideBurn_MT", makeMaterial({ map: sideburnTexture, roughness: 0.25, metalness: 0.1 })],
    ]);

    eyeMaterialsRef.current = [];
    model.traverse((object) => {
      object.frustumCulled = false;

      if (object.type === "Line") {
        object.visible = false;
      }

      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh && !(mesh as THREE.SkinnedMesh).isSkinnedMesh) return;
      if (!mesh.name.includes("Ebee_Model_mod_")) {
        mesh.visible = false;
        return;
      }
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const remapped = materials.map((material) => materialByName.get(material?.name ?? "") ?? material);
      mesh.material = Array.isArray(mesh.material) ? remapped : remapped[0];
      if (/Ebee_Model_mod_[LR]_Eye/i.test(mesh.name)) {
        for (const material of remapped) {
          if (material instanceof THREE.MeshStandardMaterial && !eyeMaterialsRef.current.includes(material)) {
            eyeMaterialsRef.current.push(material);
          }
        }
      }
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    });

    const rig = buildRig(model);
    facialRigRef.current = buildFacialRig(model);
    const nodes = getRigNodes(rig);
    rigRef.current = rig;
    nodeMapRef.current = getRigNodeMap(rig);
    protectedRestRotationsRef.current = captureRestRotations(rig);
    onRigMeta({ counts: getRigCounts(rig), nodes });
  }, [
    armorTexture,
    armorMetalnessTexture,
    armorNormalTexture,
    armorRoughnessTexture,
    bodyTexture,
    bodyMetalnessTexture,
    bodyNormalTexture,
    bodyRoughnessTexture,
    buttTexture,
    buttMetalnessTexture,
    buttNormalTexture,
    buttRoughnessTexture,
    eyeTexture,
    faceAltTexture,
    facePlateTexture,
    faceTexture,
    handTexture,
    handMetalnessTexture,
    handNormalTexture,
    handRoughnessTexture,
    helmetRoughnessTexture,
    helmetTexture,
    innerEarTexture,
    jacketTexture,
    jacketMetalnessTexture,
    jacketNormalTexture,
    jacketRoughnessTexture,
    legTexture,
    legMetalnessTexture,
    legNormalTexture,
    legRoughnessTexture,
    lowerArmorTexture,
    lowerArmorMetalnessTexture,
    lowerArmorNormalTexture,
    lowerArmorRoughnessTexture,
    model,
    onRigMeta,
    outerEarTexture,
    palmTexture,
    palmMetalnessTexture,
    palmNormalTexture,
    palmRoughnessTexture,
    sideburnTexture,
    shoesTexture,
    shoesMetalnessTexture,
    shoesNormalTexture,
    shoesRoughnessTexture,
    wingDiffuseTexture,
    wingTexture,
  ]);

  useFrame((renderState, delta) => {
    const rig = rigRef.current;
    const modelRoot = modelRef.current;
    if (!rig || !modelRoot) return;

    const t = renderState.clock.getElapsedTime();
    const pointerX = THREE.MathUtils.clamp(renderState.pointer.x, -0.8, 0.8);
    const pointerY = THREE.MathUtils.clamp(renderState.pointer.y, -0.8, 0.8);
    if (previousStateRef.current !== state || previousBehaviorRef.current !== behavior) {
      previousStateRef.current = state;
      previousBehaviorRef.current = behavior;
      transitionStartRef.current = t;
    }

    const transition = THREE.MathUtils.smoothstep(
      THREE.MathUtils.clamp((t - transitionStartRef.current) / BEHAVIOR_TRANSITION_SECONDS, 0, 1),
      0,
      1,
    );

    modelRoot.position.x = 0;
    modelRoot.position.y = -1.52;
    modelRoot.position.z = 0;
    modelRoot.rotation.x = THREE.MathUtils.damp(modelRoot.rotation.x, 0, 7, delta);
    modelRoot.rotation.y = THREE.MathUtils.damp(modelRoot.rotation.y, 0, 7, delta);
    modelRoot.rotation.z = THREE.MathUtils.damp(modelRoot.rotation.z, 0, 7, delta);

    restoreProtectedBodyPose(protectedRestRotationsRef.current);
    if (databaseWeight > 0) {
      const motionFrame = sampleMotionFrame({ t, pointerX, pointerY, state, transition, intent, databaseWeight }, motionDatabase);
      applyRigPose(rig, motionFrame.pose, delta, smoothSpeed);
      applyNodeManualPose(nodeMapRef.current, motionFrame.nodePose, delta, smoothSpeed);
      restoreProtectedBodyPose(protectedRestRotationsRef.current);
    }
    applyRigPose(rig, getControlledBehaviorPose(behavior, t, transition), delta, smoothSpeed);
    applyFacialBehavior(
      facialRigRef.current,
      eyeMaterialsRef.current,
      behavior,
      speechPulse,
      t,
      transition,
      delta,
      smoothSpeed,
    );
    applyManualPose(rig, getFinalBehaviorOverride(behavior), delta, smoothSpeed);
    applyManualPose(rig, manualPose, delta, smoothSpeed);
    applyNodeManualPose(nodeMapRef.current, nodePose, delta, smoothSpeed);
    restoreProtectedBodyPose(protectedRestRotationsRef.current);
  });

  return <primitive ref={modelRef} object={model} position={[0, -1.52, 0]} scale={0.4} />;
}

function Loader() {
  return (
    <Html center>
      <div className="avatar-3d-loading">Loading Ebee rig</div>
    </Html>
  );
}

function JointLab({
  selectedJoint,
  setSelectedJoint,
  selectedNode,
  setSelectedNode,
  selectedPreset,
  setSelectedPreset,
  manualPose,
  setManualPose,
  nodePose,
  setNodePose,
  intent,
  setIntent,
  motionDatabaseFrameCount,
  motionDatabaseStatus,
  motionDatabaseSource,
  motionDatabaseSourceSchema,
  fineMotionNodeCount,
  manifestStatus,
  rigMapStatus,
  rigMapNodeCount,
  ai4AnimationContractStatus,
  ai4AnimationExportSchema,
  databaseWeight,
  setDatabaseWeight,
  smoothSpeed,
  setSmoothSpeed,
  rigMeta,
}: {
  selectedJoint: JointKey;
  setSelectedJoint: (joint: JointKey) => void;
  selectedNode: string;
  setSelectedNode: (node: string) => void;
  selectedPreset: string;
  setSelectedPreset: (preset: string) => void;
  manualPose: ManualPose;
  setManualPose: (pose: ManualPose) => void;
  nodePose: RigNodePose;
  setNodePose: (pose: RigNodePose) => void;
  intent: MotionIntent;
  setIntent: (intent: MotionIntent) => void;
  motionDatabaseFrameCount: number;
  motionDatabaseStatus: "loading" | "loaded" | "fallback";
  motionDatabaseSource: string;
  motionDatabaseSourceSchema: string;
  fineMotionNodeCount: number;
  manifestStatus: "loading" | "loaded" | "fallback";
  rigMapStatus: "loading" | "loaded" | "fallback";
  rigMapNodeCount: number;
  ai4AnimationContractStatus: "loading" | "loaded" | "fallback";
  ai4AnimationExportSchema: string;
  databaseWeight: number;
  setDatabaseWeight: (weight: number) => void;
  smoothSpeed: number;
  setSmoothSpeed: (speed: number) => void;
  rigMeta: RigMeta | null;
}) {
  const current = manualPose[selectedJoint] ?? [0, 0, 0];
  const currentNode = nodePose[selectedNode] ?? [0, 0, 0];
  const presetNames = Object.keys(RIG_POSE_PRESETS);
  const [nodeSearch, setNodeSearch] = useState("");
  const nodes = rigMeta?.nodes ?? EMPTY_RIG_NODES;
  const selectedNodeMeta = nodes.find((node) => node.id === selectedNode);
  const activeGroupOverrides = Object.keys(manualPose).length;
  const activeFineOverrides = Object.keys(nodePose).length;
  const filteredNodes = useMemo(() => {
    const terms = nodeSearch
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    const matches = terms.length
      ? nodes.filter((node) => {
          const haystack = `${node.group} ${node.name} ${node.id}`.toLowerCase();
          return terms.every((term) => haystack.includes(term));
        })
      : nodes;

    const selected = selectedNodeMeta && !matches.some((node) => node.id === selectedNodeMeta.id) ? [selectedNodeMeta] : [];
    return [...selected, ...matches.slice(0, nodeSearch.trim() ? 240 : 120)];
  }, [nodeSearch, nodes, selectedNodeMeta]);

  function setAxis(axis: 0 | 1 | 2, value: number) {
    const next: [number, number, number] = [...current];
    next[axis] = value;
    setManualPose({ ...manualPose, [selectedJoint]: next });
  }

  function setNodeAxis(axis: 0 | 1 | 2, value: number) {
    if (!selectedNode) return;
    const next: [number, number, number] = [...currentNode];
    next[axis] = value;
    setNodePose({ ...nodePose, [selectedNode]: next });
  }

  function setIntentAxis(key: keyof MotionIntent, value: number) {
    setIntent({ ...intent, [key]: value });
  }

  return (
    <div className="avatar-joint-lab">
      <div className="avatar-joint-lab-title">
        <span>Joint control</span>
        <button type="button" onClick={() => setManualPose({})}>
          Reset group
        </button>
      </div>

      <div className="avatar-motion-db-status">
        Motion DB: {motionDatabaseFrameCount} {motionDatabaseStatus}
      </div>

      <div className="avatar-motion-db-status">
        Motion Source: {motionDatabaseSource} {motionDatabaseSourceSchema}
      </div>

      <div className="avatar-motion-db-status">
        Fine Motion: {fineMotionNodeCount} nodes
      </div>

      <div className="avatar-motion-db-status">
        Manual Control: {activeGroupOverrides} groups {activeFineOverrides} fine
      </div>

      <div className="avatar-motion-db-status">
        Manifest: {manifestStatus}
      </div>

      <div className="avatar-motion-db-status">
        Rig Map: {rigMapNodeCount} {rigMapStatus}
      </div>

      <div className="avatar-motion-db-status">
        AI4Animation: {ai4AnimationExportSchema} {ai4AnimationContractStatus}
      </div>

      <label className="avatar-joint-slider">
        <span>DB</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={databaseWeight}
          onChange={(event) => setDatabaseWeight(Number(event.target.value))}
        />
      </label>

      <label className="avatar-joint-slider">
        <span>SM</span>
        <input
          type="range"
          min="0.25"
          max="2.5"
          step="0.05"
          value={smoothSpeed}
          aria-label="Avatar smooth motion speed"
          onChange={(event) => setSmoothSpeed(Number(event.target.value))}
        />
      </label>

      <select
        value={selectedJoint}
        onChange={(event) => setSelectedJoint(event.target.value as JointKey)}
        aria-label="Avatar joint"
      >
        {JOINT_CONTROLS.map((joint) => (
          <option key={joint} value={joint}>
            {joint} ({rigMeta?.counts[joint] ?? 0})
          </option>
        ))}
      </select>

      <div className="avatar-preset-row">
        <select
          value={selectedPreset}
          onChange={(event) => setSelectedPreset(event.target.value)}
          aria-label="Avatar pose preset"
        >
          {presetNames.map((preset) => (
            <option key={preset} value={preset}>
              {preset}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setManualPose(RIG_POSE_PRESETS[selectedPreset] ?? {})}>
          Apply
        </button>
      </div>

      {(["X", "Y", "Z"] as const).map((axisLabel, index) => (
        <label key={axisLabel} className="avatar-joint-slider">
          <span>{axisLabel}</span>
          <input
            type="range"
            min="-1.2"
            max="1.2"
            step="0.01"
            value={current[index]}
            onChange={(event) => setAxis(index as 0 | 1 | 2, Number(event.target.value))}
          />
        </label>
      ))}

      <div className="avatar-joint-lab-title avatar-joint-lab-subtitle">
        <span>Fine joint</span>
        <button type="button" onClick={() => setNodePose({})}>
          Reset fine
        </button>
      </div>

      <input
        className="avatar-node-search"
        type="search"
        value={nodeSearch}
        placeholder="Search 750 rig nodes"
        aria-label="Search exact rig nodes"
        onChange={(event) => setNodeSearch(event.target.value)}
      />

      <select
        value={selectedNode}
        onChange={(event) => setSelectedNode(event.target.value)}
        aria-label="Avatar exact rig node"
      >
        <option value="">Select rig node ({nodes.length})</option>
        {filteredNodes.map((node) => (
          <option key={node.id} value={node.id}>
            {node.label}
          </option>
        ))}
      </select>

      <div className="avatar-node-path" title={selectedNode || "No rig node selected"}>
        {selectedNode || `Showing ${filteredNodes.length} of ${nodes.length} rig nodes`}
      </div>

      {(["X", "Y", "Z"] as const).map((axisLabel, index) => (
        <label key={`node-${axisLabel}`} className="avatar-joint-slider">
          <span>{axisLabel}</span>
          <input
            type="range"
            min="-1.2"
            max="1.2"
            step="0.01"
            value={currentNode[index]}
            disabled={!selectedNode}
            onChange={(event) => setNodeAxis(index as 0 | 1 | 2, Number(event.target.value))}
          />
        </label>
      ))}

      {(["energy", "gesture", "attention"] as const).map((key) => (
        <label key={key} className="avatar-joint-slider">
          <span>{key.slice(0, 1).toUpperCase()}</span>
          <input
            type="range"
            min="0"
            max="1.2"
            step="0.01"
            value={intent[key]}
            onChange={(event) => setIntentAxis(key, Number(event.target.value))}
          />
        </label>
      ))}

      <label className="avatar-joint-slider">
        <span>F</span>
        <input
          type="range"
          min="-0.8"
          max="0.8"
          step="0.01"
          value={intent.facing}
          onChange={(event) => setIntentAxis("facing", Number(event.target.value))}
        />
      </label>

      <label className="avatar-joint-slider">
        <span>S</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={intent.step}
          onChange={(event) => setIntentAxis("step", Number(event.target.value))}
        />
      </label>
    </div>
  );
}

export default function RiggedEbeeAvatar({
  state,
  debug = false,
  behavior = getDefaultBehavior(state),
  speechPulse = 0,
}: Props) {
  const [selectedJoint, setSelectedJoint] = useState<JointKey>("head");
  const [selectedNode, setSelectedNode] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("source");
  const [manualPose, setManualPose] = useState<ManualPose>(() => parseDebugManualPose());
  const [nodePose, setNodePose] = useState<RigNodePose>({});
  const [intentOverrides, setIntentOverrides] = useState<Partial<Record<RiggedEbeeState, MotionIntent>>>({});
  const [rigMeta, setRigMeta] = useState<RigMeta | null>(null);
  const [motionDatabase, setMotionDatabase] = useState<MotionFrame[]>([]);
  const [motionDatabaseStatus, setMotionDatabaseStatus] = useState<"loading" | "loaded" | "fallback">("loading");
  const [motionDatabaseSource, setMotionDatabaseSource] = useState("unknown");
  const [motionDatabaseSourceSchema, setMotionDatabaseSourceSchema] = useState("runtime");
  const [fineMotionNodeCount, setFineMotionNodeCount] = useState(0);
  const [manifestStatus, setManifestStatus] = useState<"loading" | "loaded" | "fallback">("loading");
  const [rigMapStatus, setRigMapStatus] = useState<"loading" | "loaded" | "fallback">("loading");
  const [rigMapNodeCount, setRigMapNodeCount] = useState(0);
  const [ai4AnimationContractStatus, setAi4AnimationContractStatus] =
    useState<"loading" | "loaded" | "fallback">("loading");
  const [ai4AnimationExportSchema, setAi4AnimationExportSchema] = useState("none");
  const [databaseWeight, setDatabaseWeight] = useState(0);
  const [smoothSpeed, setSmoothSpeed] = useState(1.35);
  const intent = intentOverrides[state] ?? STATE_INTENTS[state];
  const setIntent = (nextIntent: MotionIntent) => {
    setIntentOverrides((overrides) => ({ ...overrides, [state]: nextIntent }));
  };

  useEffect(() => {
    let cancelled = false;

    fetch(AVATAR_MANIFEST_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Avatar manifest request failed: ${response.status}`);
        return response.json() as Promise<AvatarManifestPayload>;
      })
      .then((manifest) => {
        const validManifest = manifest.schema === "hive-ebee-avatar-package/v1";

        if (!cancelled) setManifestStatus(validManifest ? "loaded" : "fallback");

        const manifestDatabasePath = manifest.motionDatabase?.path;
        const motionDatabaseUrl =
          validManifest && manifestDatabasePath
            ? `${AVATAR_BASE_URL}${manifestDatabasePath}`
            : MOTION_DATABASE_URL;
        const rigMapPath = manifest.rigMap?.path;
        const ai4AnimationContractPath = manifest.ai4AnimationContract?.path;

        if (validManifest && rigMapPath) {
          fetch(`${AVATAR_BASE_URL}${rigMapPath}`)
            .then((response) => {
              if (!response.ok) throw new Error(`Rig map request failed: ${response.status}`);
              return response.json() as Promise<RigMapPayload>;
            })
            .then((rigMap) => {
              if (!cancelled) {
                const validRigMap = rigMap.schema === "hive-ebee-rig-map/v1";
                setRigMapNodeCount(validRigMap ? rigMap.controllableNodeCount ?? 0 : 0);
                setRigMapStatus(validRigMap ? "loaded" : "fallback");
              }
            })
            .catch(() => {
              if (!cancelled) {
                setRigMapNodeCount(0);
                setRigMapStatus("fallback");
              }
            });
        } else if (!cancelled) {
          setRigMapNodeCount(0);
          setRigMapStatus("fallback");
        }

        if (validManifest && ai4AnimationContractPath) {
          fetch(`${AVATAR_BASE_URL}${ai4AnimationContractPath}`)
            .then((response) => {
              if (!response.ok) throw new Error(`AI4Animation contract request failed: ${response.status}`);
              return response.json() as Promise<Ai4AnimationContractPayload>;
            })
            .then((contract) => {
              if (!cancelled) {
                const exportSchema = contract.ai4animationExportSchema?.schema ?? "none";
                const validContract =
                  contract.schema === "hive-ebee-ai4animation-contract/v1" &&
                  exportSchema === "ai4animation-motion-export/v1" &&
                  Object.keys(contract.jointGroups ?? {}).length >= JOINT_CONTROLS.length;
                setAi4AnimationExportSchema(validContract ? exportSchema : "none");
                setAi4AnimationContractStatus(validContract ? "loaded" : "fallback");
              }
            })
            .catch(() => {
              if (!cancelled) {
                setAi4AnimationExportSchema("none");
                setAi4AnimationContractStatus("fallback");
              }
            });
        } else if (!cancelled) {
          setAi4AnimationExportSchema("none");
          setAi4AnimationContractStatus("fallback");
        }

        return fetch(motionDatabaseUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setManifestStatus("fallback");
          setRigMapNodeCount(0);
          setRigMapStatus("fallback");
          setAi4AnimationExportSchema("none");
          setAi4AnimationContractStatus("fallback");
        }
        return fetch(MOTION_DATABASE_URL);
      })
      .then((response) => {
        if (!response.ok) throw new Error(`Motion database request failed: ${response.status}`);
        return response.json() as Promise<MotionDatabasePayload>;
      })
      .then((payload) => {
        if (!cancelled) {
          const normalizedDatabase = normalizeMotionDatabase(payload);
          setMotionDatabase(normalizedDatabase);
          setMotionDatabaseStatus(normalizedDatabase.length > 0 ? "loaded" : "fallback");
          setMotionDatabaseSource(payload.source ?? "unknown");
          setMotionDatabaseSourceSchema(payload.sourceSchema ?? "runtime");
          setFineMotionNodeCount(
            payload.nodePose?.nodePathCount ??
              Math.max(0, ...normalizedDatabase.map((frame) => Object.keys(frame.nodePose ?? {}).length)),
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMotionDatabase([]);
          setMotionDatabaseStatus("fallback");
          setMotionDatabaseSource("unknown");
          setMotionDatabaseSourceSchema("runtime");
          setFineMotionNodeCount(0);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`avatar-3d-shell avatar-3d-${state.toLowerCase()}`}>
      <div className="avatar-3d-orbit" />

      <Canvas
        camera={{ position: [0, 0.6, 7.2], fov: 31 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        shadows={false}
      >
        <ambientLight intensity={2.4} />
        <directionalLight position={[3.4, 5.2, 5]} intensity={3.2} />
        <directionalLight position={[-3, 2.4, 2]} intensity={1.6} />
        <pointLight position={[0, 1.8, 3]} intensity={1.5} color="#67e8f9" />
        <Suspense fallback={<Loader />}>
          <RiggedModel
            state={state}
            behavior={behavior}
            speechPulse={speechPulse}
            manualPose={manualPose}
            nodePose={nodePose}
            intent={intent}
            motionDatabase={motionDatabase}
            databaseWeight={databaseWeight}
            smoothSpeed={smoothSpeed}
            onRigMeta={setRigMeta}
          />
        </Suspense>
      </Canvas>

      {state === "SPEAKING" && (
        <div className="avatar-3d-mouth-pulse avatar-3d-mouth-overlay">
          <span />
          <span />
          <span />
        </div>
      )}

      <div className="avatar-3d-status-chip">
        <span className="avatar-3d-status-dot" />
        {stateLabels[state]}
      </div>

      {debug && (
        <JointLab
          selectedJoint={selectedJoint}
          setSelectedJoint={setSelectedJoint}
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          selectedPreset={selectedPreset}
          setSelectedPreset={setSelectedPreset}
          manualPose={manualPose}
          setManualPose={setManualPose}
          nodePose={nodePose}
          setNodePose={setNodePose}
          intent={intent}
          setIntent={setIntent}
          motionDatabaseFrameCount={motionDatabase.length}
          motionDatabaseStatus={motionDatabaseStatus}
          motionDatabaseSource={motionDatabaseSource}
          motionDatabaseSourceSchema={motionDatabaseSourceSchema}
          fineMotionNodeCount={fineMotionNodeCount}
          manifestStatus={manifestStatus}
          rigMapStatus={rigMapStatus}
          rigMapNodeCount={rigMapNodeCount}
          ai4AnimationContractStatus={ai4AnimationContractStatus}
          ai4AnimationExportSchema={ai4AnimationExportSchema}
          databaseWeight={databaseWeight}
          setDatabaseWeight={setDatabaseWeight}
          smoothSpeed={smoothSpeed}
          setSmoothSpeed={setSmoothSpeed}
          rigMeta={rigMeta}
        />
      )}
    </div>
  );
}
