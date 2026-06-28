import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const productPath = path.join(root, "rag-eval-report.product.json");
const rawPath = path.join(root, "rag-eval-report.raw-backend.json");
const outputPath = path.join(root, "docs", "RAG_ACCURACY_STATUS.md");

async function readReport(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

function resultRows(report) {
  if (!report?.results) return [];

  return report.results.map((result) => {
    const status = result.passed ? "PASS" : "WARN";
    const gaps = [
      ...(result.missingKeywords ?? []).map((keyword) => `missing keyword: ${keyword}`),
      ...(result.missingSources ?? []).map((source) => `missing source: ${source}`),
      result.ragDisabled ? "RAG flag false" : "",
      result.error ? `error: ${result.error}` : "",
    ].filter(Boolean);

    return `| ${result.id} | ${status} | ${gaps.join("; ") || "-"} |`;
  });
}

function summaryLine(label, report) {
  if (!report) return `- ${label}: report missing`;
  return `- ${label}: ${report.passed}/${report.total} passed`;
}

const product = await readReport(productPath);
const raw = await readReport(rawPath);

const markdown = `# Hive RAG Accuracy Status

Generated from:

- \`rag-eval-report.product.json\`
- \`rag-eval-report.raw-backend.json\`

## Summary

${summaryLine("Commercial product path", product)}
${summaryLine("Raw backend path", raw)}

## Interpretation

The commercial kiosk path is protected by generated deterministic course-structure knowledge and backend fallback. The raw backend path is evaluated against the fine-tuned Intelligent Robotics backend scope: project/progression rules plus rebuilt Intelligent Robotics year, BYOC, university-subject, and prerequisite coverage.

## Product Results

| Case | Status | Gaps |
| --- | --- | --- |
${resultRows(product).join("\n") || "| - | - | product report missing |"}

## Raw Backend Results

| Case | Status | Gaps |
| --- | --- | --- |
${resultRows(raw).join("\n") || "| - | - | raw report missing |"}

## Backend Fix Command

\`\`\`powershell
$env:HIVE_BACKEND_PATH='C:\\Users\\jeysa\\Desktop\\Final Years\\hive-backend'
npm run backend:patch:status
npm run backend:patch:check
npm run backend:patch:apply
npm run rag:eval:raw
\`\`\`
`;

await fs.writeFile(outputPath, markdown);
console.log(`Wrote ${path.relative(root, outputPath)}`);
