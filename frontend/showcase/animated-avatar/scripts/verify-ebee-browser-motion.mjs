import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const url = "http://127.0.0.1:5175/?avatarDebug=1";
const browsers = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const browser = browsers.find((candidate) => fs.existsSync(candidate));

if (!browser) {
  throw new Error("No Chrome or Edge executable found for browser avatar verification.");
}

async function waitForServer(timeoutMs = 12000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch("http://127.0.0.1:5175");
      if (response.ok) return true;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }
  return false;
}

let server = null;
if (!(await waitForServer(800))) {
  server = spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", "5175"], {
    cwd: process.cwd(),
    shell: true,
    stdio: "ignore",
  });

  if (!(await waitForServer())) {
    server?.kill();
    throw new Error("Vite server did not start for browser avatar verification.");
  }
}

const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "ebee-browser-motion-"));
const profileDir = path.join(outDir, "profile");
const firstPath = path.join(outDir, "first.png");
const secondPath = path.join(outDir, "second.png");

function runBrowser(args) {
  const result = spawnSync(browser, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`Browser check failed: ${result.stderr || result.stdout}`);
  }
  return result;
}

function screenshot(output, virtualTimeBudget) {
  runBrowser([
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    `--user-data-dir=${profileDir}-${virtualTimeBudget}`,
    "--window-size=1440,1000",
    "--run-all-compositor-stages-before-draw",
    `--virtual-time-budget=${virtualTimeBudget}`,
    `--screenshot=${output}`,
    url,
  ]);
}

function byteDiff(a, b) {
  const length = Math.min(a.length, b.length);
  let diff = Math.abs(a.length - b.length);

  for (let index = 0; index < length; index += 1) {
    diff += Math.abs(a[index] - b[index]);
  }

  return diff;
}

try {
  screenshot(firstPath, 5200);
  screenshot(secondPath, 8200);

  const dom = runBrowser([
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    `--user-data-dir=${path.join(outDir, "profile-dom")}`,
    "--window-size=1440,1000",
    "--virtual-time-budget=7000",
    "--dump-dom",
    url,
  ]).stdout;

  const first = fs.readFileSync(firstPath);
  const second = fs.readFileSync(secondPath);
  const diff = byteDiff(first, second);
  const motionSourceMatch = dom.match(/Motion Source:\s*([^<]+)/);
  const motionSourceText = motionSourceMatch?.[1]?.trim() ?? "";
  const fineJoint = dom.includes("Select rig node (750)");
  const motionDatabaseMatch = dom.match(/Motion DB:\s*(\d+)\s+loaded/);
  const motionDatabaseFrameCount = Number(motionDatabaseMatch?.[1] ?? 0);
  const motionDatabaseLoaded = motionDatabaseFrameCount >= 60;
  const fallbackMotionSourceLoaded = motionSourceText === "procedural-ai4animation-adapter runtime";
  const ai4AnimationMotionSourceLoaded = motionSourceText.includes("ai4animation-motion-export/v1");
  const motionSourceLoaded = fallbackMotionSourceLoaded || ai4AnimationMotionSourceLoaded;
  const fineMotionMatch = dom.match(/Fine Motion:\s*(\d+)\s+nodes/);
  const fineMotionNodeCount = Number(fineMotionMatch?.[1] ?? 0);
  const fineMotionLoaded = fineMotionNodeCount >= 637;
  const manifestLoaded = dom.includes("Manifest: loaded");
  const rigMapLoaded = dom.includes("Rig Map: 750 loaded");
  const ai4AnimationContractLoaded = dom.includes("AI4Animation: ai4animation-motion-export/v1 loaded");
  const databaseSlider = dom.includes(">DB</span>");
  const smoothSlider = dom.includes(">SM</span>");
  const nodeSearch = dom.includes("Search 750 rig nodes");
  const manualControlStatus = dom.includes("Manual Control: 0 groups 0 fine");

  const result = {
    firstBytes: first.length,
    secondBytes: second.length,
    screenshotByteDiff: diff,
    motionSourceText,
    motionDatabaseFrameCount,
    fineJoint,
    motionDatabaseLoaded,
    motionSourceLoaded,
    fallbackMotionSourceLoaded,
    ai4AnimationMotionSourceLoaded,
    fineMotionNodeCount,
    fineMotionLoaded,
    manifestLoaded,
    rigMapLoaded,
    ai4AnimationContractLoaded,
    databaseSlider,
    smoothSlider,
    nodeSearch,
    manualControlStatus,
  };

  if (first.length < 150000 || second.length < 150000) {
    throw new Error(`Avatar screenshots look too small or blank: ${JSON.stringify(result)}`);
  }

  if (diff < 250000) {
    throw new Error(`Avatar screenshots did not change enough over time: ${JSON.stringify(result)}`);
  }

  if (!fineJoint) {
    throw new Error(`Fine joint selector was not present in DOM: ${JSON.stringify(result)}`);
  }

  if (!motionDatabaseLoaded) {
    throw new Error(`External motion database was not loaded in debug UI: ${JSON.stringify(result)}`);
  }

  if (!motionSourceLoaded) {
    throw new Error(`Motion database source was not loaded in debug UI: ${JSON.stringify(result)}`);
  }

  if (!fineMotionLoaded) {
    throw new Error(`Exact-node motion layer was not loaded in debug UI: ${JSON.stringify(result)}`);
  }

  if (!manifestLoaded) {
    throw new Error(`Avatar manifest was not loaded in debug UI: ${JSON.stringify(result)}`);
  }

  if (!rigMapLoaded) {
    throw new Error(`Avatar rig map was not loaded in debug UI: ${JSON.stringify(result)}`);
  }

  if (!ai4AnimationContractLoaded) {
    throw new Error(`AI4Animation contract was not loaded in debug UI: ${JSON.stringify(result)}`);
  }

  if (!databaseSlider) {
    throw new Error(`Database blend slider was not present in debug UI: ${JSON.stringify(result)}`);
  }

  if (!smoothSlider) {
    throw new Error(`Smooth motion slider was not present in debug UI: ${JSON.stringify(result)}`);
  }

  if (!nodeSearch) {
    throw new Error(`Searchable fine-joint control was not present in debug UI: ${JSON.stringify(result)}`);
  }

  if (!manualControlStatus) {
    throw new Error(`Manual joint override status was not present in debug UI: ${JSON.stringify(result)}`);
  }

  console.log(JSON.stringify(result, null, 2));
} finally {
  server?.kill();
}
