const fs = require("node:fs");
const path = require("node:path");

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = require("C:/Users/jeysa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"));
}

const ROOT = path.resolve(__dirname, "..");
const INPUT = path.join(ROOT, "clean_data", "eval", "mixed_regression_questions_1500.jsonl");
const REPORT = path.join(ROOT, "reports", "ui_mixed_300_live_eval_report.json");
const URL = process.env.UI_EVAL_URL || "http://127.0.0.1:8080";
const LIMIT = Number(process.env.UI_EVAL_LIMIT || 300);
const THRESHOLD = Number(process.env.UI_EVAL_THRESHOLD || 0.6);

function parseJsonl(file) {
  return fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function normalize(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9%/.-]+/g, " ").replace(/\s+/g, " ").trim();
}

function tokens(value) {
  return normalize(value).split(" ").filter((token) => token.length >= 3 || /\d/.test(token));
}

function overlap(expected, actual) {
  const expectedTokens = [...new Set(tokens(expected))];
  if (!expectedTokens.length) return 1;
  const actualTokens = new Set(tokens(actual));
  return expectedTokens.filter((token) => actualTokens.has(token)).length / expectedTokens.length;
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] ?? 0;
}

(async () => {
  const rows = parseJsonl(INPUT).slice(0, LIMIT);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        cancel() {},
        speak() {},
        getVoices() { return []; },
        onvoiceschanged: null,
      },
      configurable: true,
    });
  });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.locator("textarea").first().waitFor({ timeout: 30000 });

  const results = [];
  for (const [index, row] of rows.entries()) {
    const textarea = page.locator("textarea").first();
    const before = await page.locator(".message-row.assistant .message-text").count();
    const start = Date.now();
    await textarea.fill(row.question);
    await page.getByRole("button", { name: "Send" }).first().click();
    await page.waitForFunction(
      (count) => {
        const nodes = [...document.querySelectorAll(".message-row.assistant .message-text")];
        return nodes.length > count && nodes[nodes.length - 1].textContent?.trim() !== "Checking programme rules...";
      },
      before,
      { timeout: 45000 }
    );
    const durationMs = Date.now() - start;
    const answer = await page.locator(".message-row.assistant .message-text").last().innerText();
    const score = overlap(row.expected_answer, answer);
    results.push({
      id: row.id,
      original_id: row.original_id,
      category: row.category,
      style: row.style ?? "none",
      question: row.question,
      score: Number(score.toFixed(4)),
      passed: score >= THRESHOLD,
      duration_ms: durationMs,
      expected_preview: String(row.expected_answer).replace(/\s+/g, " ").slice(0, 220),
      answer_preview: String(answer).replace(/\s+/g, " ").slice(0, 220),
    });
    if ((index + 1) % 50 === 0) console.log(`checked ${index + 1}/${rows.length}`);
  }

  await browser.close();

  const passed = results.filter((r) => r.passed).length;
  const durations = results.map((r) => r.duration_ms);
  const report = {
    url: URL,
    input_file: INPUT,
    total: results.length,
    passed,
    failed: results.length - passed,
    accuracy: Number((passed / results.length).toFixed(4)),
    threshold: THRESHOLD,
    average_overlap: Number((results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(4)),
    average_response_ms: Number((durations.reduce((sum, value) => sum + value, 0) / durations.length).toFixed(1)),
    p95_response_ms: percentile(durations, 95),
    max_response_ms: Math.max(...durations),
    failures: results.filter((r) => !r.passed).slice(0, 50),
    results,
  };
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`${passed}/${results.length} passed accuracy=${report.accuracy} avg_overlap=${report.average_overlap} avg_ms=${report.average_response_ms} p95_ms=${report.p95_response_ms}`);
  console.log(`report=${REPORT}`);
})();
