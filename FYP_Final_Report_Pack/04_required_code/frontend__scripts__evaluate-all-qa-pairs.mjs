import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const defaultQaPath = path.join(repoRoot, "hive-backend", "data", "kb", "intelligent_robotics_qa_pairs.jsonl");
const qaPath = process.env.QA_PAIRS_PATH ?? defaultQaPath;
const baseUrl = (process.env.QA_EVAL_BASE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
const reportPath = path.join(__dirname, "..", "qa-pair-full-eval-report.json");
const concurrency = Number(process.env.QA_EVAL_CONCURRENCY ?? 12);

function parseJsonl(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9%/.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value) {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length >= 3 || /\d/.test(token));
}

function overlapScore(expected, actual) {
  const expectedTokens = [...new Set(tokens(expected))];
  if (expectedTokens.length === 0) return 1;
  const actualSet = new Set(tokens(actual));
  const hits = expectedTokens.filter((token) => actualSet.has(token)).length;
  return hits / expectedTokens.length;
}

async function ask(row) {
  const response = await fetch(`${baseUrl}/ask`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question: row.question, history: [] }),
  });
  const payload = await response.json().catch(() => ({}));
  return { status: response.status, payload };
}

async function mapLimit(rows, limit, worker) {
  const results = new Array(rows.length);
  let next = 0;

  async function run() {
    while (next < rows.length) {
      const index = next;
      next += 1;
      results[index] = await worker(rows[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, rows.length) }, run));
  return results;
}

const rows = parseJsonl(await fs.readFile(qaPath, "utf8"));
console.log("Full QA-pair live eval");
console.log(`Base URL: ${baseUrl}`);
console.log(`QA rows: ${rows.length}`);
console.log(`Concurrency: ${concurrency}`);

const startedAt = Date.now();
const results = await mapLimit(rows, concurrency, async (row, index) => {
  try {
    const result = await ask(row);
    const answer = result.payload.answer ?? "";
    const score = overlapScore(row.answer, answer);
    const usedRag = result.payload.used_rag === true || result.payload.usedRag === true;
    const route = result.payload.route ?? "";
    const passed = result.status >= 200 && result.status < 300 && usedRag && route !== "ft_first" && score >= 0.6;

    if ((index + 1) % 100 === 0 || index + 1 === rows.length) {
      console.log(`Checked ${index + 1}/${rows.length}`);
    }

    return {
      id: row.id,
      type: row.type,
      course_code: row.course_code,
      question: row.question,
      status: result.status,
      route,
      usedRag,
      score: Number(score.toFixed(4)),
      passed,
      expectedPreview: String(row.answer).replace(/\s+/g, " ").slice(0, 220),
      answerPreview: String(answer).replace(/\s+/g, " ").slice(0, 220),
      sources: result.payload.sources ?? [],
    };
  } catch (error) {
    return {
      id: row.id,
      type: row.type,
      question: row.question,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

const passed = results.filter((result) => result.passed).length;
const failed = results.length - passed;
const scoreValues = results.map((result) => result.score ?? 0);
const averageScore = scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length;
const minScore = Math.min(...scoreValues);

const report = {
  baseUrl,
  qaPath,
  total: rows.length,
  passed,
  failed,
  averageScore: Number(averageScore.toFixed(4)),
  minScore: Number(minScore.toFixed(4)),
  generatedAt: new Date().toISOString(),
  durationSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(2)),
  failures: results.filter((result) => !result.passed).slice(0, 50),
  results,
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log("");
console.log(`Summary: ${passed}/${rows.length} passed`);
console.log(`Average overlap: ${report.averageScore}`);
console.log(`Minimum overlap: ${report.minScore}`);
console.log(`Report: ${path.relative(repoRoot, reportPath)}`);

if (failed > 0) {
  process.exit(1);
}
