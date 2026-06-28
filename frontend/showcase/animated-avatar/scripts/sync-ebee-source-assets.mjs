import fs from "node:fs";
import path from "node:path";

const defaultSourceDir = "C:/Users/jeysa/Desktop/Ebee_New";
const sourceDir = path.resolve(process.argv[2] ?? defaultSourceDir);
const sourceImagesDir = path.join(sourceDir, "sourceimages");
const sourceMayaRigPath = path.join(sourceDir, "Ebee_Model_rig_New.mb");
const sourcePreviewPath = path.join(sourceDir, "Ebee_preview.jpg");
const avatarDir = path.resolve("public/avatar/ebee_new");
const publicImagesDir = path.join(avatarDir, "sourceimages");

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

function assertFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${label}: ${filePath}`);
  }

  const stat = fs.statSync(filePath);
  if (!stat.isFile() || stat.size <= 0) {
    throw new Error(`${label} is empty or not a file: ${filePath}`);
  }

  return stat.size;
}

assertFile(sourceMayaRigPath, "source Maya Ebee rig");
assertFile(sourcePreviewPath, "source Ebee preview");
fs.mkdirSync(publicImagesDir, { recursive: true });

let copied = 0;
let textureBytes = 0;
for (const file of requiredTextureFiles) {
  const sourcePath = path.join(sourceImagesDir, file);
  const outputPath = path.join(publicImagesDir, file);
  const bytes = assertFile(sourcePath, "source Ebee texture");
  fs.copyFileSync(sourcePath, outputPath);
  textureBytes += bytes;
  copied += 1;
}

console.log(
  JSON.stringify(
    {
      status: "synced",
      sourceDir,
      outputDir: publicImagesDir,
      copied,
      textureBytes,
      sourceMayaRigBytes: fs.statSync(sourceMayaRigPath).size,
      sourcePreviewBytes: fs.statSync(sourcePreviewPath).size,
    },
    null,
    2,
  ),
);
