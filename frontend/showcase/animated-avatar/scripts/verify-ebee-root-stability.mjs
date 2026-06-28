import fs from "node:fs";
import path from "node:path";

const avatarPath = path.resolve("src/components/RiggedEbeeAvatar.tsx");
const controllerPath = path.resolve("src/components/ebeeRigController.ts");
const avatarSource = fs.readFileSync(avatarPath, "utf8");
const controllerSource = fs.readFileSync(controllerPath, "utf8");

const checks = [
  {
    name: "model-root-x-is-fixed",
    passed: /modelRoot\.position\.x\s*=\s*0\s*;/.test(avatarSource),
    detail: "Top-level FBX object must not move left or right.",
  },
  {
    name: "model-root-y-is-fixed",
    passed: /modelRoot\.position\.y\s*=\s*-1\.52\s*;/.test(avatarSource),
    detail: "Top-level FBX object must stay grounded at a constant Y offset.",
  },
  {
    name: "model-root-z-is-fixed",
    passed: /modelRoot\.position\.z\s*=\s*0\s*;/.test(avatarSource),
    detail: "Top-level FBX object must not move forward or backward.",
  },
  {
    name: "model-root-pitch-damps-to-zero",
    passed: /modelRoot\.rotation\.x\s*=\s*THREE\.MathUtils\.damp\(modelRoot\.rotation\.x,\s*0,/.test(avatarSource),
    detail: "Top-level FBX pitch should return to zero instead of following gestures.",
  },
  {
    name: "model-root-yaw-damps-to-zero",
    passed: /modelRoot\.rotation\.y\s*=\s*THREE\.MathUtils\.damp\(modelRoot\.rotation\.y,\s*0,/.test(avatarSource),
    detail: "Top-level FBX yaw should return to zero instead of following gestures.",
  },
  {
    name: "model-root-roll-damps-to-zero",
    passed: /modelRoot\.rotation\.z\s*=\s*THREE\.MathUtils\.damp\(modelRoot\.rotation\.z,\s*0,/.test(avatarSource),
    detail: "Top-level FBX roll should return to zero instead of shaking.",
  },
  {
    name: "default-db-blend-disabled",
    passed: /const\s+\[databaseWeight,\s*setDatabaseWeight\]\s*=\s*useState\(0\)/.test(avatarSource),
    detail: "Customer runtime must not apply raw exact-node Unity frames by default.",
  },
  {
    name: "exact-node-motion-scaled-by-db-weight",
    passed: /Object\.entries\(match\.nodePose\)\.map\(\(\[nodeId,\s*target\]\)\s*=>\s*\[nodeId,\s*scaleTarget\(target,\s*matchWeight\)\]\)/.test(
      controllerSource,
    ),
    detail: "Exact rig-node motion must be multiplied by the DB blend weight.",
  },
  {
    name: "protected-body-joints-reset-around-animation-layers",
    passed:
      avatarSource.indexOf("restoreProtectedBodyPose(protectedRestRotationsRef.current);") <
        avatarSource.indexOf("applyRigPose(rig, motionFrame.pose") &&
      avatarSource.lastIndexOf("restoreProtectedBodyPose(protectedRestRotationsRef.current);") >
        avatarSource.lastIndexOf("applyNodeManualPose(nodeMapRef.current, nodePose"),
    detail: "Root and lower-body joints must be reset before and after all pose/manual layers.",
  },
  {
    name: "controlled-behavior-after-motion-sample",
    passed:
      avatarSource.indexOf("applyRigPose(rig, motionFrame.pose") <
      avatarSource.indexOf("applyRigPose(rig, getControlledBehaviorPose"),
    detail: "Stable controlled behavior must override sampled source pose each frame.",
  },
  {
    name: "facial-behavior-after-controlled-body",
    passed:
      avatarSource.indexOf("applyRigPose(rig, getControlledBehaviorPose") <
      avatarSource.lastIndexOf("applyFacialBehavior("),
    detail: "Facial motion should stay separate from body/root motion.",
  },
];

const failed = checks.filter((check) => !check.passed);
const result = {
  avatarPath,
  controllerPath,
  checks,
};

if (failed.length > 0) {
  throw new Error(`Ebee root stability checks failed: ${JSON.stringify(result, null, 2)}`);
}

console.log(JSON.stringify(result, null, 2));
