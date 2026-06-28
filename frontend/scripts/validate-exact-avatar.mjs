import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const fallbackPng = join(root, "src", "assets", "ebee-exact-transparent.png");
const exactDir = join(root, "public", "avatar", "exact");
const strictMode = process.argv.includes("--strict");
const states = ["idle", "listening", "thinking", "speaking", "error"];
const videoFiles = states.map((state) => `${state}.webm`);
const mp4VideosByState = {
  idle: ["ebee_idle_5s.mp4", "ebee_idle_5s_2.mp4", "ebee_idle_5s_3.mp4"],
  listening: ["ebee_listening_5s.mp4", "ebee_listening_5s_2.mp4"],
  thinking: ["ebee_listening_5s.mp4", "ebee_listening_5s_2.mp4"],
  speaking: ["ebee_speaking_5s.mp4", "ebee_speaking_5s_2.mp4", "ebee_speaking_5s_3.mp4"],
  error: ["ebee_idle_5s.mp4", "ebee_idle_5s_2.mp4", "ebee_idle_5s_3.mp4"],
};
const poseFiles = states.map((state) => `${state}.png`);
const frameCount = 8;

function readPngInfo(path) {
  const bytes = readFileSync(path);
  const signature = bytes.subarray(0, 8).toString("hex");
  const pngSignature = "89504e470d0a1a0a";

  if (signature !== pngSignature) {
    throw new Error(`${path} is not a valid PNG file.`);
  }

  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const colorType = bytes[25];
  const hasAlpha = colorType === 4 || colorType === 6;

  return {
    width,
    height,
    colorType,
    hasAlpha,
    size: statSync(path).size,
  };
}

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

let hasError = false;

console.log("Exact Ebee avatar asset check\n");
if (strictMode) {
  console.log("Mode: strict final readiness\n");
}

if (!existsSync(fallbackPng)) {
  console.error(`Missing fallback PNG: ${fallbackPng}`);
  hasError = true;
} else {
  const png = readPngInfo(fallbackPng);
  console.log(
    `Fallback PNG: ${png.width}x${png.height}, ${formatBytes(png.size)}, alpha=${png.hasAlpha ? "yes" : "no"}`
  );

  if (!png.hasAlpha) {
    console.error("Fallback PNG must have transparency.");
    hasError = true;
  }
}

console.log("\nTransparent video loops:");
for (const file of videoFiles) {
  const path = join(exactDir, file);
  if (!existsSync(path)) {
    const message = strictMode
      ? `- ${file}: missing, PNG sequence can satisfy final moving avatar`
      : `- ${file}: missing, PNG fallback will be used`;
    console.log(message);
    continue;
  }

  const size = statSync(path).size;
  if (size === 0) {
    console.error(`- ${file}: empty file`);
    hasError = true;
    continue;
  }

  console.log(`- ${file}: found, ${formatBytes(size)}`);
}

const mp4VideoStatus = new Map();
console.log("\nMP4 avatar video playlists:");
for (const state of states) {
  const files = mp4VideosByState[state];
  let validVideos = 0;

  if (files.length === 0) {
    console.log(`- ${state}: no MP4 playlist configured, fallback assets will be used`);
    mp4VideoStatus.set(state, false);
    continue;
  }

  for (const file of files) {
    const path = join(exactDir, "videos", file);
    if (!existsSync(path)) {
      console.error(`- ${state}: missing ${file}`);
      hasError = true;
      continue;
    }

    const size = statSync(path).size;
    if (size === 0) {
      console.error(`- ${state}: ${file} is empty`);
      hasError = true;
      continue;
    }

    validVideos += 1;
    console.log(`- ${state}: ${file} found, ${formatBytes(size)}`);
  }

  mp4VideoStatus.set(state, validVideos === files.length);
}

const sequenceStatus = new Map();
console.log("\nTransparent PNG frame sequences:");
for (const state of states) {
  const frameDir = join(exactDir, state);
  let validFrames = 0;

  for (let index = 0; index < frameCount; index += 1) {
    const frame = join(frameDir, `frame-${String(index).padStart(2, "0")}.png`);
    if (!existsSync(frame)) {
      continue;
    }

    const png = readPngInfo(frame);
    if (!png.hasAlpha) {
      console.error(`- ${state}: frame-${String(index).padStart(2, "0")}.png is missing alpha transparency`);
      hasError = true;
      continue;
    }

    validFrames += 1;
  }

  const complete = validFrames === frameCount;
  sequenceStatus.set(state, complete);
  if (!complete) {
    const message = strictMode
      ? `- ${state}: ${validFrames}/${frameCount} frames found, required for final exact moving avatar`
      : `- ${state}: ${validFrames}/${frameCount} frames found, still PNG fallback can be used`;
    console.log(message);
    if (strictMode) {
      hasError = true;
    }
    continue;
  }

  console.log(`- ${state}: ${validFrames}/${frameCount} transparent frames found`);
}

console.log("\nOptional transparent PNG state poses:");
for (const file of poseFiles) {
  const path = join(exactDir, file);
  if (!existsSync(path)) {
    console.log(`- ${file}: missing, base PNG fallback will be used`);
    continue;
  }

  const png = readPngInfo(path);
  if (!png.hasAlpha) {
    console.error(`- ${file}: found but missing alpha transparency`);
    hasError = true;
    continue;
  }

  console.log(`- ${file}: found, ${png.width}x${png.height}, ${formatBytes(png.size)}, alpha=yes`);
}

if (strictMode) {
  for (const state of states) {
    const hasVideo = existsSync(join(exactDir, `${state}.webm`)) && statSync(join(exactDir, `${state}.webm`)).size > 0;
    const hasMp4Playlist = mp4VideoStatus.get(state);
    const hasSequence = sequenceStatus.get(state);
    if (!hasVideo && !hasMp4Playlist && !hasSequence) {
      console.error(`Strict mode requires a moving asset for ${state}: WebM, MP4 playlist, or complete PNG sequence.`);
      hasError = true;
    }
  }
}

if (hasError) {
  process.exitCode = 1;
} else if (strictMode) {
  console.log("\nFinal exact moving avatar asset pack is ready.");
}
