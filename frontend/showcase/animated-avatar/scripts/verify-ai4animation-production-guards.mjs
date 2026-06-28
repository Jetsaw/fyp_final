import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { MOTION_CLIPS } from "../src/components/ebeeRigController.ts";

const importedSamplePath = path.resolve("dist/ebee_ai4animation_motion_sample.json");
const weakCoveragePath = path.resolve("dist/ebee_ai4animation_weak_node_coverage.json");
const promotedSamplePath = path.resolve("dist/ebee_ai4animation_guard_promoted_sample.json");
const rejectedOutputPath = path.resolve("dist/ebee_ai4animation_guard_rejected.json");
const rawSamplePath = path.resolve("scripts/fixtures/ai4animation-ebee-motion-sample.json");
const states = Object.keys(MOTION_CLIPS);

if (!fs.existsSync(importedSamplePath)) {
  throw new Error("Missing imported AI4Animation sample. Run npm run avatar:ai4animation:import:check first.");
}

function runNode(script, args) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: "pipe",
  });
}

function expectFailure(name, script, args, expectedPattern) {
  const result = runNode(script, args);
  const output = `${result.stdout}\n${result.stderr}`;

  if (result.status === 0) {
    throw new Error(`${name} unexpectedly passed`);
  }

  if (!expectedPattern.test(output)) {
    throw new Error(`${name} failed for the wrong reason: ${output}`);
  }

  return {
    name,
    status: "rejected",
    matched: expectedPattern.source,
  };
}

function buildWeakCoverageDatabase() {
  const data = JSON.parse(fs.readFileSync(importedSamplePath, "utf8"));
  const framesByState = new Map(states.map((state) => [state, data.frames.find((frame) => frame.state === state)]));
  const frameCounts = Object.fromEntries(states.map((state) => [state, 12]));

  const frames = states.flatMap((state) => {
    const source = framesByState.get(state);
    if (!source) throw new Error(`Imported AI4Animation sample is missing ${state}`);

    return Array.from({ length: 12 }, (_, index) => ({
      ...source,
      id: `${source.id}-weak-coverage-${index.toString().padStart(2, "0")}`,
      time: Number((source.time + index * 0.08).toFixed(3)),
      feature: {
        ...source.feature,
        normalizedTime: Number(((source.feature.normalizedTime ?? 0) + index / 12).toFixed(3)),
      },
    }));
  });

  const weakCoverage = {
    ...data,
    source: "production-guard-weak-node-coverage",
    frameCounts,
    frames,
  };

  fs.mkdirSync(path.dirname(weakCoveragePath), { recursive: true });
  fs.writeFileSync(weakCoveragePath, `${JSON.stringify(weakCoverage, null, 2)}\n`);
}

buildWeakCoverageDatabase();

const preparePromotedSample = runNode("scripts/promote-ai4animation-motion.mjs", [
  importedSamplePath,
  promotedSamplePath,
  "--allow-sample",
]);
if (preparePromotedSample.status !== 0) {
  throw new Error(`Could not prepare promoted sample guard fixture: ${preparePromotedSample.stderr || preparePromotedSample.stdout}`);
}

const results = [
  expectFailure(
    "promote-sample-without-allow",
    "scripts/promote-ai4animation-motion.mjs",
    [importedSamplePath, rejectedOutputPath],
    /needs at least \d+ nodePose entries|at least 12 frames/,
  ),
  expectFailure(
    "promote-weak-node-coverage",
    "scripts/promote-ai4animation-motion.mjs",
    [weakCoveragePath, rejectedOutputPath],
    /needs at least \d+ nodePose entries/,
  ),
  expectFailure(
    "install-sample-without-allow",
    "scripts/install-ai4animation-motion.mjs",
    [promotedSamplePath, rejectedOutputPath],
    /Refusing to install sample-only AI4Animation motion data/,
  ),
  expectFailure(
    "production-installer-rejects-sample-export",
    "scripts/install-ai4animation-production-pipeline.mjs",
    [rawSamplePath],
    /needs at least \d+ nodePose entries|at least 12 frames/,
  ),
];

console.log(
  JSON.stringify(
    {
      status: "passed",
      guards: results,
    },
    null,
    2,
  ),
);
