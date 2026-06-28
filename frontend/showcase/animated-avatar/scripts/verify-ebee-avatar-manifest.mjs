import fs from "node:fs";
import path from "node:path";
import { JOINT_CONTROLS } from "../src/components/ebeeRigController.ts";

const avatarDir = path.resolve("public/avatar/ebee_new");
const manifestPath = path.join(avatarDir, "ebee_avatar_manifest.json");

if (!fs.existsSync(manifestPath)) {
  throw new Error("Missing Ebee avatar manifest. Run npm run avatar:manifest:export.");
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

if (manifest.schema !== "hive-ebee-avatar-package/v1") {
  throw new Error(`Unexpected avatar manifest schema ${manifest.schema}`);
}

function assertFile(entry, label) {
  const fullPath = path.join(avatarDir, entry.path);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing ${label}: ${entry.path}`);
  }

  const bytes = fs.statSync(fullPath).size;
  if (bytes !== entry.bytes) {
    throw new Error(`${label} size mismatch for ${entry.path}: ${bytes} !== ${entry.bytes}`);
  }

  return bytes;
}

const modelBytes = assertFile(manifest.model, "model");
if (modelBytes < 1_000_000) {
  throw new Error(`Model file is unexpectedly small: ${modelBytes}`);
}

if (!Array.isArray(manifest.textures) || manifest.textures.length < 10) {
  throw new Error(`Expected at least 10 texture entries, found ${manifest.textures?.length ?? 0}`);
}

const texturePaths = new Set(manifest.textures.map((texture) => path.basename(texture.path)));
const requiredTextureFiles = manifest.textureExpectations?.requiredFiles ?? [];
if (!Array.isArray(requiredTextureFiles) || requiredTextureFiles.length < 40) {
  throw new Error(`Expected a full source texture requirement list, found ${requiredTextureFiles.length}`);
}

for (const file of requiredTextureFiles) {
  if (!texturePaths.has(file)) {
    throw new Error(`Missing source Ebee texture in manifest: ${file}`);
  }
}

let textureBytes = 0;
for (const texture of manifest.textures) {
  textureBytes += assertFile(texture, "texture");
}

const motionBytes = assertFile(manifest.motionDatabase, "motion database");
const motionDatabase = JSON.parse(fs.readFileSync(path.join(avatarDir, manifest.motionDatabase.path), "utf8"));
const rigMapBytes = assertFile(manifest.rigMap, "rig map");
const rigMap = JSON.parse(fs.readFileSync(path.join(avatarDir, manifest.rigMap.path), "utf8"));
const ai4AnimationContractBytes = assertFile(manifest.ai4AnimationContract, "AI4Animation contract");
const ai4AnimationContract = JSON.parse(
  fs.readFileSync(path.join(avatarDir, manifest.ai4AnimationContract.path), "utf8"),
);
const ai4AnimationSchemaBytes = assertFile(manifest.ai4AnimationExportJsonSchema, "AI4Animation JSON schema");
const ai4AnimationSchema = JSON.parse(
  fs.readFileSync(path.join(avatarDir, manifest.ai4AnimationExportJsonSchema.path), "utf8"),
);

if (motionDatabase.schema !== manifest.motionDatabase.schema) {
  throw new Error(`Motion database schema mismatch: ${motionDatabase.schema} !== ${manifest.motionDatabase.schema}`);
}

if (motionDatabase.frames.length !== manifest.motionDatabase.frameCount) {
  throw new Error(`Motion frame mismatch: ${motionDatabase.frames.length} !== ${manifest.motionDatabase.frameCount}`);
}

if ((motionDatabase.source ?? "unknown") !== manifest.motionDatabase.source) {
  throw new Error(`Motion source mismatch: ${motionDatabase.source} !== ${manifest.motionDatabase.source}`);
}

if ((motionDatabase.sourceSchema ?? null) !== manifest.motionDatabase.sourceSchema) {
  throw new Error(`Motion source schema mismatch: ${motionDatabase.sourceSchema} !== ${manifest.motionDatabase.sourceSchema}`);
}

if ((motionDatabase.installedBy ?? null) !== manifest.motionDatabase.installedBy) {
  throw new Error(`Motion install metadata mismatch: ${motionDatabase.installedBy} !== ${manifest.motionDatabase.installedBy}`);
}

const expectedPreferredRuntimeDatabase =
  motionDatabase.schema === "hive-ebee-motion-database/v1" &&
  motionDatabase.sourceSchema === "ai4animation-motion-export/v1" &&
  motionDatabase.runtimeMotionDatabase === true;
if (manifest.motionDatabase.preferredRuntimeDatabase !== expectedPreferredRuntimeDatabase) {
  throw new Error(
    `Preferred runtime database mismatch: ${manifest.motionDatabase.preferredRuntimeDatabase} !== ${expectedPreferredRuntimeDatabase}`,
  );
}

if (motionBytes < 100_000) {
  throw new Error(`Motion database is unexpectedly small: ${motionBytes}`);
}

if (rigMap.schema !== manifest.rigMap.schema) {
  throw new Error(`Rig map schema mismatch: ${rigMap.schema} !== ${manifest.rigMap.schema}`);
}

if (rigMap.controllableNodeCount !== manifest.rigMap.controllableNodeCount) {
  throw new Error(
    `Rig map node count mismatch: ${rigMap.controllableNodeCount} !== ${manifest.rigMap.controllableNodeCount}`,
  );
}

if (ai4AnimationContract.schema !== "hive-ebee-ai4animation-contract/v1") {
  throw new Error(`Unexpected AI4Animation contract schema ${ai4AnimationContract.schema}`);
}

if (ai4AnimationContract.schema !== manifest.ai4AnimationContract.schema) {
  throw new Error(
    `AI4Animation contract schema mismatch: ${ai4AnimationContract.schema} !== ${manifest.ai4AnimationContract.schema}`,
  );
}

if (ai4AnimationContract.ai4animationExportSchema?.schema !== manifest.ai4AnimationContract.exportSchema) {
  throw new Error(
    `AI4Animation export schema mismatch: ${ai4AnimationContract.ai4animationExportSchema?.schema} !== ${manifest.ai4AnimationContract.exportSchema}`,
  );
}

if (Object.keys(ai4AnimationContract.jointGroups ?? {}).length !== manifest.ai4AnimationContract.jointGroups) {
  throw new Error(
    `AI4Animation joint group mismatch: ${Object.keys(ai4AnimationContract.jointGroups ?? {}).length} !== ${manifest.ai4AnimationContract.jointGroups}`,
  );
}

if (ai4AnimationSchema.$schema !== manifest.ai4AnimationExportJsonSchema.schema) {
  throw new Error(`AI4Animation JSON schema draft mismatch: ${ai4AnimationSchema.$schema} !== ${manifest.ai4AnimationExportJsonSchema.schema}`);
}

if (ai4AnimationSchema.properties?.schema?.const !== manifest.ai4AnimationExportJsonSchema.exportSchema) {
  throw new Error(
    `AI4Animation JSON export schema mismatch: ${ai4AnimationSchema.properties?.schema?.const} !== ${manifest.ai4AnimationExportJsonSchema.exportSchema}`,
  );
}

if ((ai4AnimationSchema["x-ebee-contract"]?.joints ?? []).length !== manifest.ai4AnimationExportJsonSchema.jointGroups) {
  throw new Error(
    `AI4Animation JSON schema joint group mismatch: ${(ai4AnimationSchema["x-ebee-contract"]?.joints ?? []).length} !== ${manifest.ai4AnimationExportJsonSchema.jointGroups}`,
  );
}

const requiredGroups = new Set(manifest.rigExpectations.requiredGroups);
for (const joint of JOINT_CONTROLS) {
  if (!requiredGroups.has(joint)) {
    throw new Error(`Manifest missing required rig group ${joint}`);
  }
}

console.log(
  JSON.stringify(
    {
      schema: manifest.schema,
      modelBytes,
      textureCount: manifest.textures.length,
      requiredSourceTextures: requiredTextureFiles.length,
      textureBytes,
      motionFrames: manifest.motionDatabase.frameCount,
      motionSource: manifest.motionDatabase.source,
      motionSourceSchema: manifest.motionDatabase.sourceSchema,
      runtimeMotionDatabase: manifest.motionDatabase.runtimeMotionDatabase,
      preferredRuntimeDatabase: manifest.motionDatabase.preferredRuntimeDatabase,
      rigMapBytes,
      ai4AnimationContractBytes,
      ai4AnimationSchemaBytes,
      ai4AnimationExportSchema: manifest.ai4AnimationContract.exportSchema,
      controllableNodeCount: manifest.rigMap.controllableNodeCount,
      requiredGroups: requiredGroups.size,
    },
    null,
    2,
  ),
);
