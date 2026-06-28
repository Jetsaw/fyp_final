import fs from "node:fs";
import { JOINT_CONTROLS } from "../src/components/ebeeRigController.ts";

const rigMapPath = new URL("../public/avatar/ebee_new/ebee_rig_map.json", import.meta.url);

if (!fs.existsSync(rigMapPath)) {
  throw new Error("Missing Ebee rig map artifact. Run npm run avatar:rig:export.");
}

const rigMap = JSON.parse(fs.readFileSync(rigMapPath, "utf8"));

if (rigMap.schema !== "hive-ebee-rig-map/v1") {
  throw new Error(`Unexpected rig map schema ${rigMap.schema}`);
}

for (const group of JOINT_CONTROLS) {
  const nodes = rigMap.groups?.[group];
  if (!Array.isArray(nodes) || nodes.length === 0) {
    throw new Error(`Missing rig map group ${group}`);
  }

  for (const node of nodes) {
    if (!node.path || !node.name || !node.type) {
      throw new Error(`Invalid node entry in ${group}`);
    }
  }

  if (rigMap.counts?.[group] !== nodes.length) {
    throw new Error(`Count mismatch for ${group}: ${rigMap.counts?.[group]} !== ${nodes.length}`);
  }
}

if (rigMap.controllableNodeCount < 120) {
  throw new Error(`Expected broad controllable nodes, found ${rigMap.controllableNodeCount}`);
}

if (rigMap.visibleAvatarMeshCount < 40) {
  throw new Error(`Expected visible avatar meshes, found ${rigMap.visibleAvatarMeshCount}`);
}

console.log(
  JSON.stringify(
    {
      schema: rigMap.schema,
      groups: JOINT_CONTROLS.length,
      controllableNodeCount: rigMap.controllableNodeCount,
      visibleAvatarMeshCount: rigMap.visibleAvatarMeshCount,
    },
    null,
    2,
  ),
);
