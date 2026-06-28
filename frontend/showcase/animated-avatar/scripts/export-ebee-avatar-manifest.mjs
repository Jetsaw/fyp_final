import fs from "node:fs";
import path from "node:path";

const avatarDir = path.resolve("public/avatar/ebee_new");
const sourceImagesDir = path.join(avatarDir, "sourceimages");
const fallbackMotionDatabasePath = path.join(avatarDir, "ebee_motion_database.json");
const ai4AnimationMotionDatabasePath = path.join(avatarDir, "ebee_ai4animation_motion_database.json");
const rigMapPath = path.join(avatarDir, "ebee_rig_map.json");
const ai4AnimationContractPath = path.join(avatarDir, "ebee_ai4animation_contract.json");
const ai4AnimationSchemaPath = path.join(avatarDir, "ebee_ai4animation_export.schema.json");
const modelPath = path.join(avatarDir, "ebee_new.fbx");
const outputPath = path.join(avatarDir, "ebee_avatar_manifest.json");
const requiredTextureFiles = [
  "Body_dif.png",
  "Body_met.png",
  "Body_nor.png",
  "Body_rou.png",
  "BtmArmor_dif.png",
  "BtmArmor_met.png",
  "BtmArmor_nor.png",
  "BtmArmor_rou.png",
  "Butt_dif.png",
  "Butt_met.png",
  "Butt_nor.png",
  "Butt_rou.png",
  "Eyegreen.jpg",
  "Face01_dif.png",
  "Face_dif.png",
  "Hand_dif.png",
  "Hand_met.png",
  "Hand_nor.png",
  "Hand_rou.png",
  "Jacket_dif.png",
  "Jacket_met.png",
  "Jacket_nor.png",
  "Jacket_rou.png",
  "Leg_dif.png",
  "Leg_met.png",
  "Leg_nor.png",
  "Leg_rou.png",
  "Palm_dif.png",
  "Palm_met.png",
  "Palm_nor.png",
  "Palm_rou.png",
  "Shoes_dif.png",
  "Shoes_met.png",
  "Shoes_nor.png",
  "Shoes_rou.png",
  "UppArmor_dif.png",
  "UppArmor_met.png",
  "UppArmor_nor.png",
  "UppArmor_rou.png",
  "faceplate_Diffuse.tga",
  "helmet_Diffuse_new.tga",
  "helmet_Roughness_Baked.png",
  "iin_ear_Diffuse.tga",
  "out_ear_Diffuse_new.tga",
  "sideburns_Diffuse.tga",
  "wing_CircuitTest_V4.png",
  "wing_Diffuse.tga",
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getMotionDatabaseCandidate(filePath, manifestPath) {
  if (!fs.existsSync(filePath)) return null;

  const payload = readJson(filePath);
  return {
    path: manifestPath,
    filePath,
    payload,
    preferred:
      payload.schema === "hive-ebee-motion-database/v1" &&
      payload.sourceSchema === "ai4animation-motion-export/v1" &&
      payload.runtimeMotionDatabase === true,
  };
}

const motionCandidates = [
  getMotionDatabaseCandidate(ai4AnimationMotionDatabasePath, "ebee_ai4animation_motion_database.json"),
  getMotionDatabaseCandidate(fallbackMotionDatabasePath, "ebee_motion_database.json"),
].filter(Boolean);
const motionCandidate = motionCandidates.find((candidate) => candidate.preferred) ?? motionCandidates[0];

if (!motionCandidate) {
  throw new Error("Missing Ebee motion database. Run npm run avatar:motion:export first.");
}

const motionDatabase = motionCandidate.payload;
const rigMap = JSON.parse(fs.readFileSync(rigMapPath, "utf8"));
const ai4AnimationContract = JSON.parse(fs.readFileSync(ai4AnimationContractPath, "utf8"));
const ai4AnimationSchema = JSON.parse(fs.readFileSync(ai4AnimationSchemaPath, "utf8"));
const textures = fs
  .readdirSync(sourceImagesDir)
  .filter((file) => /\.(png|jpe?g|tga)$/i.test(file))
  .sort()
  .map((file) => {
    const fullPath = path.join(sourceImagesDir, file);
    return {
      path: `sourceimages/${file}`,
      bytes: fs.statSync(fullPath).size,
    };
  });

const manifest = {
  schema: "hive-ebee-avatar-package/v1",
  name: "Ebee",
  generatedBy: "scripts/export-ebee-avatar-manifest.mjs",
  model: {
    path: "ebee_new.fbx",
    bytes: fs.statSync(modelPath).size,
    format: "fbx",
  },
  textures,
  textureExpectations: {
    sourcePath: "C:/Users/jeysa/Desktop/Ebee_New/sourceimages",
    requiredFiles: requiredTextureFiles,
    requiredCount: requiredTextureFiles.length,
  },
  motionDatabase: {
    path: motionCandidate.path,
    schema: motionDatabase.schema,
    bytes: fs.statSync(motionCandidate.filePath).size,
    frameCount: motionDatabase.frames.length,
    frameCounts: motionDatabase.frameCounts,
    source: motionDatabase.source ?? "unknown",
    sourceSchema: motionDatabase.sourceSchema ?? null,
    promotedBy: motionDatabase.promotedBy ?? null,
    installedBy: motionDatabase.installedBy ?? null,
    runtimeMotionDatabase: motionDatabase.runtimeMotionDatabase === true,
    preferredRuntimeDatabase: motionCandidate.preferred,
    fallbackPath: "ebee_motion_database.json",
    ai4AnimationPath: "ebee_ai4animation_motion_database.json",
  },
  rigMap: {
    path: "ebee_rig_map.json",
    schema: rigMap.schema,
    bytes: fs.statSync(rigMapPath).size,
    controllableNodeCount: rigMap.controllableNodeCount,
    visibleAvatarMeshCount: rigMap.visibleAvatarMeshCount,
  },
  ai4AnimationContract: {
    path: "ebee_ai4animation_contract.json",
    schema: ai4AnimationContract.schema,
    bytes: fs.statSync(ai4AnimationContractPath).size,
    exportSchema: ai4AnimationContract.ai4animationExportSchema.schema,
    jointGroups: Object.keys(ai4AnimationContract.jointGroups).length,
  },
  ai4AnimationExportJsonSchema: {
    path: "ebee_ai4animation_export.schema.json",
    schema: ai4AnimationSchema.$schema,
    bytes: fs.statSync(ai4AnimationSchemaPath).size,
    exportSchema: ai4AnimationSchema.properties.schema.const,
    jointGroups: ai4AnimationSchema["x-ebee-contract"].joints.length,
  },
  rigExpectations: {
    controllableNodeCountMin: 120,
    visibleAvatarMeshCountMin: 40,
    requiredGroups: [
      "root",
      "spine",
      "chest",
      "neck",
      "head",
      "facePlate",
      "antenna",
      "shoulderL",
      "elbowL",
      "wristL",
      "fingersL",
      "shoulderR",
      "elbowR",
      "wristR",
      "fingersR",
      "hipL",
      "kneeL",
      "ankleL",
      "toesL",
      "hipR",
      "kneeR",
      "ankleR",
      "toesR",
      "wingL",
      "wingR",
      "tail",
    ],
  },
};

fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      outputPath,
      schema: manifest.schema,
      textures: manifest.textures.length,
      motionFrames: manifest.motionDatabase.frameCount,
    },
    null,
    2,
  ),
);
