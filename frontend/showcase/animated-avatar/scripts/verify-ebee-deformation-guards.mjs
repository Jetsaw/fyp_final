import fs from "node:fs";
import path from "node:path";

const avatarPath = path.resolve("src/components/RiggedEbeeAvatar.tsx");
const controllerPath = path.resolve("src/components/ebeeRigController.ts");
const avatarSource = fs.readFileSync(avatarPath, "utf8");
const controllerSource = fs.readFileSync(controllerPath, "utf8");

const scaleWrites = [...avatarSource.matchAll(/(?:^|[^A-Za-z0-9_])[\w.]+\.scale(?:\.[xyz])?\s*=/g)].map((match) => match[0].trim());
const positionWrites = [...avatarSource.matchAll(/(?:^|[^A-Za-z0-9_])[\w.]+\.position\.[xyz]\s*=/g)].map((match) => match[0].trim());
const allowedPositionWrites = new Set(["modelRoot.position.x =", "modelRoot.position.y =", "modelRoot.position.z ="]);
const unsafePositionWrites = positionWrites.filter((write) => !allowedPositionWrites.has(write));
const protectedJointTargets = [
  "root:",
  "hipL:",
  "hipR:",
  "kneeL:",
  "kneeR:",
  "ankleL:",
  "ankleR:",
  "toesL:",
  "toesR:",
];

const checks = [
  {
    name: "no-runtime-scale-writes",
    passed: scaleWrites.length === 0,
    detail: `Unexpected runtime scale writes: ${scaleWrites.join(", ") || "none"}`,
  },
  {
    name: "fixed-render-scale-only",
    passed: /<primitive\s+ref=\{modelRef\}\s+object=\{model\}\s+position=\{\[0,\s*-1\.52,\s*0\]\}\s+scale=\{0\.4\}\s*\/>/.test(
      avatarSource,
    ),
    detail: "The avatar may only use the fixed render scale on the primitive mount.",
  },
  {
    name: "no-unsafe-position-animation",
    passed:
      unsafePositionWrites.length === 0 &&
      positionWrites.includes("modelRoot.position.x =") &&
      positionWrites.includes("modelRoot.position.y =") &&
      positionWrites.includes("modelRoot.position.z ="),
    detail: `Position writes should be limited to fixed grounded XYZ. Found: ${positionWrites.join(", ") || "none"}`,
  },
  {
    name: "no-morph-target-runtime",
    passed: !/morphTargetInfluences|morphTargetDictionary/.test(avatarSource + controllerSource),
    detail: "Runtime should not claim or animate morph targets that the visible Ebee meshes do not expose.",
  },
  {
    name: "bone-rotation-only-pose-application",
    passed:
      /function dampRotation[\s\S]*?object\.rotation\.x[\s\S]*?object\.rotation\.y[\s\S]*?object\.rotation\.z/.test(avatarSource) &&
      !/object\.scale|object\.position/.test(avatarSource.match(/function dampRotation[\s\S]*?\n}\n/)?.[0] ?? ""),
    detail: "Manual/group pose application should damp rotations only.",
  },
  {
    name: "source-model-cloned-with-skeleton-utils",
    passed: /import\s+\{\s*clone\s*\}\s+from\s+"three\/examples\/jsm\/utils\/SkeletonUtils\.js"/.test(avatarSource),
    detail: "The FBX should be cloned through SkeletonUtils to preserve skeletal hierarchy.",
  },
  {
    name: "protected-body-joints-restored-each-frame",
    passed:
      /const PROTECTED_BODY_JOINTS = \[/.test(avatarSource) &&
      /function restoreProtectedBodyPose/.test(avatarSource) &&
      avatarSource.indexOf("restoreProtectedBodyPose(protectedRestRotationsRef.current);") <
        avatarSource.lastIndexOf("restoreProtectedBodyPose(protectedRestRotationsRef.current);"),
    detail: "Root, hips, knees, ankles, and toes must be restored to imported rest rotations every frame.",
  },
  {
    name: "protected-node-controls-filtered",
    passed: /PROTECTED_NODE_PATH_PATTERN\.test\(id\)/.test(avatarSource),
    detail: "Fine exact-node controls must ignore root and lower-body nodes.",
  },
  {
    name: "no-runtime-lower-body-pose-targets",
    passed: !protectedJointTargets.some((target) => controllerSource.includes(target)),
    detail: "The procedural motion generator must not emit root or lower-body rotation targets.",
  },
];

const failed = checks.filter((check) => !check.passed);
const result = {
  avatarPath,
  controllerPath,
  checks,
};

if (failed.length > 0) {
  throw new Error(`Ebee deformation guard checks failed: ${JSON.stringify(result, null, 2)}`);
}

console.log(JSON.stringify(result, null, 2));
