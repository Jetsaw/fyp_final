import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, "..");
const defaultKbPath = "C:\\Users\\jeysa\\Desktop\\Final Years\\hive-backend\\data\\kb\\programme_structure.jsonl";
const sourcePath = process.env.COURSE_STRUCTURE_JSONL ?? defaultKbPath;
const tsOutputPath = path.join(frontendRoot, "src", "courseKnowledgeData.ts");
const jsonOutputPath = path.join(__dirname, "course-knowledge.generated.json");

const programmeConfig = {
  robotics: {
    aliases: ["intelligent robotics", "robotics", "rob"],
    shortName: "Intelligent Robotics",
  },
};

function parseJsonl(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function programmeKey(programme) {
  const value = String(programme ?? "").toLowerCase();
  if (value.includes("robotics")) return "robotics";
  return null;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function termAliases(label) {
  const lower = label.toLowerCase();
  const withoutSlash = lower.replace(/\//g, " ");
  const aliases = new Set([lower, withoutSlash]);

  const termMatch = lower.match(/\bterm\s+(\d{4})\b/);
  if (termMatch) {
    aliases.add(termMatch[1]);
    aliases.add(`trimester ${termMatch[1]}`);
  }

  const yearMatch = lower.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    aliases.add(yearMatch[1]);
  }

  return [...aliases];
}

function extractCourses(content) {
  const [, afterColon = content] = content.split(/:\s+/, 2);
  return afterColon
    .replace(/\.$/, "")
    .split(",")
    .map((course) => course.trim())
    .filter(Boolean);
}

function buildKnowledge(rows) {
  const byProgramme = new Map();

  for (const row of rows) {
    const key = programmeKey(row.programme);
    if (!key) continue;

    if (!byProgramme.has(key)) {
      byProgramme.set(key, {
        key,
        label: row.programme,
        shortName: programmeConfig[key].shortName,
        aliases: programmeConfig[key].aliases,
        source: row.source,
        overview: "",
        terms: [],
        projectRule: "",
        industrialTrainingRule: "",
        mpuNote: "",
      });
    }

    const programme = byProgramme.get(key);
    const content = row.content ?? row.answer ?? "";

    if (row.type === "programme_overview" && !programme.overview) {
      programme.overview = content;
      const credits = content.match(/total credits:\s*(\d+)/i);
      if (credits) {
        programme.totalCredits = Number(credits[1]);
      }
    }

    if (row.type === "term_structure") {
      const label = content.split(":")[0].trim();
      programme.terms.push({
        id: slugify(label),
        label,
        aliases: termAliases(label),
        courses: extractCourses(content),
        courseCodes: row.course_codes ?? [],
      });
    }

    if (row.type === "rule" && /project/i.test(content)) {
      programme.projectRule = content;
    }

    if (row.type === "rule" && /industrial/i.test(content)) {
      programme.industrialTrainingRule = content;
    }

    if (row.type === "mpu_notes") {
      programme.mpuNote = content;
    }
  }

  return [...byProgramme.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function renderTs(programmes) {
  return `export type ProgrammeKnowledge = {
  key: "robotics";
  label: string;
  shortName: string;
  aliases: string[];
  source: string;
  overview: string;
  totalCredits?: number;
  terms: { id: string; label: string; aliases: string[]; courses: string[]; courseCodes: string[] }[];
  projectRule: string;
  industrialTrainingRule: string;
  mpuNote: string;
};

export const programmes = ${JSON.stringify(programmes, null, 2)} satisfies ProgrammeKnowledge[];
`;
}

const rows = parseJsonl(await fs.readFile(sourcePath, "utf8"));
const programmes = buildKnowledge(rows);

if (programmes.length === 0) {
  throw new Error(`No supported programmes found in ${sourcePath}`);
}

await fs.writeFile(tsOutputPath, renderTs(programmes));
await fs.writeFile(jsonOutputPath, `${JSON.stringify(programmes, null, 2)}\n`);

console.log(`Generated ${path.relative(frontendRoot, tsOutputPath)}`);
console.log(`Generated ${path.relative(frontendRoot, jsonOutputPath)}`);
