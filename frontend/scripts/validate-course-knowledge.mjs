import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const knowledgePath = path.join(__dirname, "course-knowledge.generated.json");

const programmes = JSON.parse(await fs.readFile(knowledgePath, "utf8"));
const failures = [];

function requireField(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

function findProgramme(key) {
  return programmes.find((programme) => programme.key === key);
}

const robotics = findProgramme("robotics");

requireField(robotics, "Intelligent Robotics programme is missing");
requireField(programmes.length === 1, "Course knowledge should contain only Intelligent Robotics");

for (const programme of programmes) {
  requireField(programme.label, `${programme.key}: label is missing`);
  requireField(programme.shortName, `${programme.key}: shortName is missing`);
  requireField(programme.source, `${programme.key}: source is missing`);
  requireField(programme.overview, `${programme.key}: overview is missing`);
  requireField(programme.projectRule, `${programme.key}: project rule is missing`);
  requireField(programme.industrialTrainingRule, `${programme.key}: industrial training rule is missing`);
  requireField(programme.mpuNote, `${programme.key}: MPU note is missing`);
  requireField(Array.isArray(programme.terms) && programme.terms.length > 0, `${programme.key}: terms are missing`);

  for (const term of programme.terms ?? []) {
    requireField(term.id, `${programme.key}: term id is missing`);
    requireField(term.label, `${programme.key}: term label is missing`);
    requireField(Array.isArray(term.aliases) && term.aliases.length > 0, `${programme.key}/${term.label}: aliases are missing`);
    requireField(Array.isArray(term.courses) && term.courses.length > 0, `${programme.key}/${term.label}: courses are missing`);
  }
}

if (robotics) {
  requireField(robotics.terms.length >= 3, "Intelligent Robotics should include Year 1, Year 2, and Year 3 structure rows");
  requireField(
    robotics.terms.some((term) => term.label.toLowerCase() === "year 1"),
    "Intelligent Robotics should include Year 1",
  );
  requireField(
    robotics.terms.some((term) => term.label.toLowerCase() === "year 2"),
    "Intelligent Robotics should include Year 2",
  );
  requireField(
    robotics.terms.some((term) => term.label.toLowerCase() === "year 3"),
    "Intelligent Robotics should include Year 3",
  );
}

if (failures.length > 0) {
  console.error("Course knowledge validation failed");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Course knowledge validation passed");
console.log(`Programmes: ${programmes.length}`);
for (const programme of programmes) {
  console.log(`- ${programme.shortName}: ${programme.terms.length} terms`);
}
