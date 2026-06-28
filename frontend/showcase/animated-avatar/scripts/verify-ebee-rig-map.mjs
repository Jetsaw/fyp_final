import fs from "node:fs";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

globalThis.document = {
  createElementNS: () => ({
    addEventListener: () => {},
    removeEventListener: () => {},
    set src(_value) {},
  }),
};

const assetPath = new URL("../public/avatar/ebee_new/ebee_new.fbx", import.meta.url);
const file = fs.readFileSync(assetPath);
const loader = new FBXLoader();
const root = loader.parse(
  file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength),
  "/avatar/ebee_new/",
);

const rigPatterns = {
  root: /(?:FitSkeleton\/Root$|FKRoot_M$|FKXRoot_M$)/,
  spine: /(?:Spine1$|FKSpine1_M$|FKXSpine1_M$)/,
  chest: /(?:Chest$|FKChest_M$|FKXChest_M$)/,
  neck: /(?:Neck$|FKNeck_M$|FKXNeck_M$)/,
  head: /(?:Head$|FKHead_M$|FKXHead_M$)/,
  facePlate: /(?:facePlate|Faceplate)/i,
  antenna: /(?:headTip|Anthenna|Antenna)/i,
  shoulderL: /(?:FKShoulder_L|FKXShoulder_L|Shoulder_L)/,
  shoulderR: /(?:FKShoulder_R|FKXShoulder_R|Shoulder_R)/,
  elbowL: /(?:FKElbow_L|FKXElbow_L|Elbow_L)/,
  elbowR: /(?:FKElbow_R|FKXElbow_R|Elbow_R)/,
  wristL: /(?:FKWrist_L|FKXWrist_L|Wrist_L|FKCup_L|FKXCup_L)/,
  wristR: /(?:FKWrist_R|FKXWrist_R|Wrist_R|FKCup_R|FKXCup_R)/,
  fingersL: /(?:Finger\d_L|FKX.*Finger\d_L|FK.*Finger\d_L)/,
  fingersR: /(?:Finger\d_R|FKX.*Finger\d_R|FK.*Finger\d_R)/,
  hipL: /(?:FKHip_L|FKXHip_L|Hip_L)/,
  hipR: /(?:FKHip_R|FKXHip_R|Hip_R)/,
  kneeL: /(?:FKKnee_L|FKXKnee_L|Knee_L)/,
  kneeR: /(?:FKKnee_R|FKXKnee_R|Knee_R)/,
  ankleL: /(?:FKAnkle_L|FKXAnkle_L|Ankle_L)/,
  ankleR: /(?:FKAnkle_R|FKXAnkle_R|Ankle_R)/,
  toesL: /(?:FKToes_L|Toes_L)/,
  toesR: /(?:FKToes_R|Toes_R)/,
  wingL: /(?:FKwing\d_L|FKXwing\d_L|wing\d_L)/,
  wingR: /(?:FKwing\d_R|FKXwing\d_R|wing\d_R)/,
  tail: /(?:FKtail|tail\d)/,
};

function objectPath(object) {
  const parts = [];
  let current = object;
  while (current) {
    if (current.name) parts.push(current.name);
    current = current.parent;
  }
  return parts.reverse().join("/");
}

const counts = Object.fromEntries(Object.keys(rigPatterns).map((key) => [key, 0]));
const controllableNodePaths = new Set();
let visibleAvatarMeshCount = 0;
let totalSkinnedMeshes = 0;

root.traverse((object) => {
  const path = objectPath(object);
  for (const [key, pattern] of Object.entries(rigPatterns)) {
    if (pattern.test(path)) {
      counts[key] += 1;
      controllableNodePaths.add(path);
    }
  }

  if (object.isSkinnedMesh) totalSkinnedMeshes += 1;
  if ((object.isMesh || object.isSkinnedMesh) && object.name.includes("Ebee_Model_mod_")) {
    visibleAvatarMeshCount += 1;
  }
});

const missing = Object.entries(counts)
  .filter(([, count]) => count === 0)
  .map(([key]) => key);

console.log(
  JSON.stringify(
    {
      counts,
      controllableNodeCount: controllableNodePaths.size,
      totalSkinnedMeshes,
      visibleAvatarMeshCount,
    },
    null,
    2,
  ),
);

if (missing.length > 0) {
  throw new Error(`Missing rig groups: ${missing.join(", ")}`);
}

if (visibleAvatarMeshCount < 40) {
  throw new Error(`Expected many visible Ebee meshes, found ${visibleAvatarMeshCount}`);
}

if (controllableNodePaths.size < 120) {
  throw new Error(`Expected broad fine-joint control, found ${controllableNodePaths.size} unique nodes`);
}
