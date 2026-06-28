import fs from "node:fs";
import path from "node:path";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

globalThis.document = {
  createElementNS: () => ({
    addEventListener: () => {},
    removeEventListener: () => {},
    set src(_value) {},
  }),
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

function findAll(root, pattern) {
  const matches = [];
  root.traverse((object) => {
    if (pattern.test(objectPath(object))) matches.push(object);
  });
  return matches;
}

const assetPath = path.resolve("public/avatar/ebee_new/ebee_new.fbx");
const file = fs.readFileSync(assetPath);
const root = new FBXLoader().parse(
  file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength),
  "/avatar/ebee_new/",
);

const visibleMeshes = [];
const morphMeshes = [];
root.traverse((object) => {
  if (!(object.isMesh || object.isSkinnedMesh) || !object.name.includes("Ebee_Model_mod_")) return;

  visibleMeshes.push(object.name);
  if (object.morphTargetDictionary && Object.keys(object.morphTargetDictionary).length > 0) {
    morphMeshes.push({
      name: object.name,
      morphTargets: Object.keys(object.morphTargetDictionary),
    });
  }
});

const controls = {
  eyeL: findAll(root, /(?:FaceDeformationSystemFollowHead\/Eye_L$|\/Eye_L$)/),
  eyeR: findAll(root, /(?:FaceDeformationSystemFollowHead\/Eye_R$|\/Eye_R$)/),
  upperTeeth: findAll(root, /(?:\/upperTeethJoint_M$)/),
  lowerTeeth: findAll(root, /(?:\/lowerTeethJoint_M$)/),
  tongue: findAll(root, /(?:\/Tongue\dJoint_M$)/),
  facePlate: findAll(root, /(?:facePlate|Faceplate)/i),
};

const result = {
  assetPath,
  visibleAvatarMeshCount: visibleMeshes.length,
  visibleMorphTargetMeshCount: morphMeshes.length,
  morphMeshes,
  controls: Object.fromEntries(
    Object.entries(controls).map(([name, objects]) => [
      name,
      {
        count: objects.length,
        sample: objects.slice(0, 5).map((object) => objectPath(object)),
      },
    ]),
  ),
};

const missing = Object.entries(controls)
  .filter(([name, objects]) => name !== "facePlate" && objects.length === 0)
  .map(([name]) => name);

if (visibleMeshes.length < 40) {
  throw new Error(`Visible Ebee mesh coverage looks too low: ${JSON.stringify(result, null, 2)}`);
}

if (missing.length > 0) {
  throw new Error(`Missing safe facial controls: ${missing.join(", ")} ${JSON.stringify(result, null, 2)}`);
}

console.log(JSON.stringify(result, null, 2));
