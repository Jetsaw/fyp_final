import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const workspaceRoot = path.join(root, "..");

const requiredFiles = [
  "docs/GITHUB_RAG_REPO_DECISION.md",
  "docs/RAG_ACCURACY_FINAL_HANDOFF.md",
  "docs/RAG_ACCURACY_STATUS.md",
  "docs/RAG_ACCURACY_UPGRADE.md",
  "scripts/apply-backend-rag-patch.ps1",
  "scripts/restore-backend-rag-patch.ps1",
  "scripts/start-course-guard-backend.ps1",
  "scripts/generate-course-knowledge.mjs",
  "scripts/validate-course-knowledge.mjs",
  "scripts/evaluate-rag-accuracy.mjs",
  "scripts/evaluate-rag-raw-backend.ps1",
  "scripts/summarize-rag-eval.mjs",
  "scripts/course-knowledge.generated.json",
  "scripts/rag-eval-set.json",
  "src/courseKnowledge.ts",
  "src/courseKnowledgeData.ts",
  "rag-eval-report.product.json",
  "rag-eval-report.raw-backend.json",
];

const requiredWorkspaceFiles = [
  "hive-backend/app/rag/course_guard.py",
  "hive-backend/data/kb/course_knowledge.generated.json",
  "hive-backend/app/api/chat.py",
  "hive-backend/app/main.py",
];

const requiredDocPatterns = [
  ["docs/GITHUB_RAG_REPO_DECISION.md", /NVIDIA\/personaplex/],
  ["docs/GITHUB_RAG_REPO_DECISION.md", /LeDat98\/NexusRAG/],
  ["docs/GITHUB_RAG_REPO_DECISION.md", /NovaSearch-Team\/RAG-Retrieval/],
  ["docs/GITHUB_RAG_REPO_DECISION.md", /FlashRank/],
  ["docs/GITHUB_RAG_REPO_DECISION.md", /ragas/i],
  ["docs/RAG_ACCURACY_FINAL_HANDOFF.md", /backend:patch:apply/],
  ["docs/RAG_ACCURACY_FINAL_HANDOFF.md", /course_guard\.py/],
  ["docs/RAG_ACCURACY_STATUS.md", /Commercial product path: \d+\/\d+ passed/],
  ["docs/RAG_ACCURACY_STATUS.md", /Raw backend path: \d+\/\d+ passed/],
  ["docs/RAG_ACCURACY_UPGRADE.md", /fine-tuned model/i],
];

const failures = [];

async function readRelative(relativePath) {
  return fs.readFile(path.join(root, relativePath), "utf8");
}

for (const relativePath of requiredFiles) {
  try {
    const stat = await fs.stat(path.join(root, relativePath));
    if (!stat.isFile() || stat.size === 0) {
      failures.push(`${relativePath} is empty or not a file`);
    }
  } catch {
    failures.push(`${relativePath} is missing`);
  }
}

for (const relativePath of requiredWorkspaceFiles) {
  try {
    const stat = await fs.stat(path.join(workspaceRoot, relativePath));
    if (!stat.isFile() || stat.size === 0) {
      failures.push(`${relativePath} is empty or not a file`);
    }
  } catch {
    failures.push(`${relativePath} is missing`);
  }
}

for (const [relativePath, pattern] of requiredDocPatterns) {
  try {
    const content = await readRelative(relativePath);
    if (!pattern.test(content)) {
      failures.push(`${relativePath} does not match ${pattern}`);
    }
  } catch {
    failures.push(`${relativePath} cannot be read for pattern check`);
  }
}

try {
  const productReport = JSON.parse(await readRelative("rag-eval-report.product.json"));
  if (productReport.passed !== productReport.total || productReport.total < 1) {
    failures.push("Product RAG report should have all cases passing");
  }
} catch {
  failures.push("Product RAG report cannot be parsed");
}

try {
  const rawReport = JSON.parse(await readRelative("rag-eval-report.raw-backend.json"));
  if (rawReport.passed !== rawReport.total || rawReport.total < 1) {
    failures.push("Raw backend RAG report should have all cases passing");
  }
} catch {
  failures.push("Raw backend RAG report cannot be parsed");
}

if (failures.length > 0) {
  console.error("RAG deliverables check failed");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("RAG deliverables check passed");
console.log(`Checked ${requiredFiles.length + requiredWorkspaceFiles.length} files`);
