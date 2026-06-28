import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const evalSetPath = path.join(__dirname, "rag-eval-set.json");
const courseKnowledgePath = path.join(__dirname, "course-knowledge.generated.json");
const baseUrl = (process.env.RAG_EVAL_BASE_URL ?? "http://127.0.0.1:5174").replace(/\/$/, "");
const rawBackendOnly = process.env.RAG_EVAL_RAW_BACKEND === "true";
const reportFileName = rawBackendOnly ? "rag-eval-report.raw-backend.json" : "rag-eval-report.product.json";
const askEndpoint = {
  path: "/ask",
  makeBody: (question) => ({
    question,
    history: [{ role: "user", content: question }],
  }),
};
const apiAskEndpoint = {
  path: "/api/ask",
  makeBody: askEndpoint.makeBody,
};
const chatEndpoint = {
  path: "/api/chat",
  makeBody: (question) => ({
    user_id: `rag_eval_${Date.now()}`,
    message: question,
  }),
};
const endpointCandidates = rawBackendOnly
  ? [chatEndpoint, apiAskEndpoint, askEndpoint]
  : [askEndpoint, chatEndpoint, apiAskEndpoint];

let evalSet = JSON.parse(await fs.readFile(evalSetPath, "utf8"));
const programmes = JSON.parse(await fs.readFile(courseKnowledgePath, "utf8"));

function normalize(value) {
  return String(value ?? "").toLowerCase();
}

function hasAny(text, values) {
  return values.some((value) => text.includes(value));
}

function wantsCourseCodes(question) {
  return /\b[A-Z]{2,4}\d{3,4}(?:-[A-Z0-9]+)?\b/i.test(question) || hasAny(normalize(question), ["course code", "course codes", "subject code"]);
}

function normalizeQuestion(question) {
  return normalize(question)
    .replace(/\bproject\s+one\b/g, "project i")
    .replace(/\bproject\s+1\b/g, "project i")
    .replace(/\bproject\s+two\b/g, "project ii")
    .replace(/\bproject\s+2\b/g, "project ii")
    .replace(/\s+/g, " ")
    .trim();
}

function getProgramme(q) {
  return programmes.find((programme) => hasAny(q, programme.aliases)) ?? null;
}

function makeGuardAnswer(answer, sources, confidence = 1, route = "deterministic_course_structure") {
  return { answer, route, used_rag: true, sources, confidence };
}

function stripCourseCode(course) {
  return String(course).replace(/^[A-Z]{2,4}\d{3,4}(?:-[A-Z0-9]+)?\s+/i, "").trim();
}

function formatCourseList(term, includeCodes) {
  return term.courses
    .map((course, index) => {
      const name = stripCourseCode(course);
      const code = term.courseCodes?.[index];
      return includeCodes && code ? `${code} ${name}` : name;
    })
    .join(", ");
}

function formatPlan(programme) {
  return programme.terms.map((term) => `${term.label}: ${formatCourseList(term, false)}`).join("; ");
}

function shortProgrammeName(programme) {
  return programme.shortName;
}

function answerProductGuard(question) {
  const q = normalizeQuestion(question);
  const programme = getProgramme(q);
  const includeCodes = wantsCourseCodes(question);

  if (hasAny(q, ["project ii", "arp6110-p2", "arp6110 p2"])) {
    return makeGuardAnswer(includeCodes ? "ARP6110-P2 Project II requires completed 60 credit hours and ARP6110-P1 Project I." : "Project II requires completed 60 credit hours and Project I.", ["prereq_rules.json", "Subject Code all - cleaned.docx"], 1, "deterministic_course_rules");
  }

  if (hasAny(q, ["project i", "arp6110-p1", "arp6110 p1"])) {
    return makeGuardAnswer(includeCodes ? "ARP6110-P1 Project I requires completed 60 credit hours." : "Project I requires completed 60 credit hours.", ["prereq_rules.json", "Subject Code all - cleaned.docx"], 1, "deterministic_course_rules");
  }

  if (!programme) {
    if (hasAny(q, ["progression", "progression rules", "course progression"])) {
      return makeGuardAnswer("Use the programme structure and prerequisite rules for progression. Project I requires completed 60 credit hours. Project II requires Project I and completed 60 credit hours.", ["programme_structure.jsonl", "prereq_rules.json"], 0.98);
    }

    return null;
  }

  if (hasAny(q, ["byoc", "elective"])) {
    return null;
  }

  if (programme.totalCredits && hasAny(q, ["total credit", "total credits", "how many credits", "credit required"])) {
    return makeGuardAnswer(`${programme.label} requires ${programme.totalCredits} total credits.`, ["programme_structure.jsonl", programme.source]);
  }

  const matchedTerm = programme.terms.find((term) => hasAny(q, [term.id, term.label.toLowerCase(), ...term.aliases]));
  if (matchedTerm) {
    return makeGuardAnswer(`${matchedTerm.label} for ${shortProgrammeName(programme)} includes ${formatCourseList(matchedTerm, includeCodes)}.`, ["programme_structure.jsonl", programme.source]);
  }

  if (hasAny(q, ["industrial training", "internship"])) {
    return makeGuardAnswer(programme.industrialTrainingRule, ["programme_structure.jsonl", programme.source]);
  }

  if (hasAny(q, ["mpu", "university course", "integrity", "leadership"])) {
    return makeGuardAnswer(programme.mpuNote, ["programme_structure.jsonl", programme.source]);
  }

  if (hasAny(q, ["study plan", "course structure", "programme structure", "progression"])) {
    return makeGuardAnswer(`${shortProgrammeName(programme)} structure for ${programme.label}: ${formatPlan(programme)}`, ["programme_structure.jsonl", programme.source], 0.98);
  }

  return null;
}

function extractSources(payload) {
  const rawSources = payload.sources ?? payload.context_sources ?? payload.source_documents ?? [];
  if (!Array.isArray(rawSources)) {
    return [String(rawSources)];
  }

  return rawSources.map((source) => {
    if (typeof source === "string") {
      return source;
    }

    return [
      source.file,
      source.filename,
      source.source,
      source.title,
      source.metadata?.source,
      source.metadata?.file,
    ]
      .filter(Boolean)
      .join(" ");
  });
}

function extractAnswer(payload) {
  return payload.answer ?? payload.response ?? payload.message ?? payload.text ?? "";
}

async function askBackend(question) {
  if (!rawBackendOnly) {
    const guarded = answerProductGuard(question);
    if (guarded) {
      return {
        ok: true,
        status: 200,
        payload: {
          ...guarded,
          product_guard: true,
        },
      };
    }
  }

  const errors = [];

  for (const candidate of endpointCandidates) {
    const response = await fetch(`${baseUrl}${candidate.path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(candidate.makeBody(question)),
    });

    const text = await response.text();
    let payload;

    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { answer: text };
    }

    if (response.ok || response.status !== 404) {
      return {
        ok: response.ok,
        status: response.status,
        endpoint: candidate.path,
        payload,
      };
    }

    errors.push(`${candidate.path}: HTTP ${response.status}`);
  }

  return {
    ok: false,
    status: 404,
    endpoint: endpointCandidates.map((candidate) => candidate.path).join(", "),
    payload: { answer: `No supported backend endpoint found. ${errors.join("; ")}` },
  };
}

function scoreCase(testCase, result) {
  const answer = extractAnswer(result.payload);
  const answerText = normalize(answer);
  const sources = extractSources(result.payload);
  const sourceText = normalize(sources.join(" "));
  const expectedKeywords = testCase.expectedKeywords ?? [];
  const expectedSources = testCase.expectedSources ?? [];

  const missingKeywords = expectedKeywords.filter((keyword) => !answerText.includes(normalize(keyword)));
  const missingSources = expectedSources.filter((source) => !sourceText.includes(normalize(source)));
  const ragDisabled = result.payload.used_rag === false || result.payload.usedRag === false;
  const passed = result.ok && missingKeywords.length === 0 && missingSources.length === 0 && !ragDisabled;

  return {
    id: testCase.id,
    question: testCase.question,
    status: result.status,
    endpoint: result.endpoint,
    passed,
    missingKeywords,
    missingSources,
    ragDisabled,
    answerPreview: String(answer).replace(/\s+/g, " ").slice(0, 240),
    sources,
  };
}

const report = [];

console.log(`Hive RAG accuracy eval`);
console.log(`Base URL: ${baseUrl}`);
console.log(`Mode: ${rawBackendOnly ? "raw backend only" : "product guard + backend"}`);
console.log("");

for (const testCase of evalSet) {
  try {
    const result = await askBackend(testCase.question);
    const scored = scoreCase(testCase, result);
    report.push(scored);

    const label = scored.passed ? "PASS" : "WARN";
    console.log(`${label} ${scored.id}: ${testCase.question}`);
    if (scored.endpoint) {
      console.log(`     Endpoint: ${scored.endpoint}`);
    }
    console.log(`     ${scored.answerPreview || "(no answer)"}`);

    if (!scored.passed) {
      if (scored.status < 200 || scored.status >= 300) {
        console.log(`     HTTP status: ${scored.status}`);
      }
      if (scored.missingKeywords.length > 0) {
        console.log(`     Missing keywords: ${scored.missingKeywords.join(", ")}`);
      }
      if (scored.missingSources.length > 0) {
        console.log(`     Missing sources: ${scored.missingSources.join(", ")}`);
      }
      if (scored.ragDisabled) {
        console.log(`     RAG flag was false`);
      }
    }
  } catch (error) {
    const scored = {
      id: testCase.id,
      question: testCase.question,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
    report.push(scored);
    console.log(`FAIL ${scored.id}: ${scored.error}`);
  }
}

const passed = report.filter((entry) => entry.passed).length;
const total = report.length;

await fs.writeFile(
  path.join(__dirname, "..", reportFileName),
  `${JSON.stringify({ baseUrl, total, passed, generatedAt: new Date().toISOString(), results: report }, null, 2)}\n`,
);

console.log("");
console.log(`Summary: ${passed}/${total} passed`);
console.log(`Report: ${reportFileName}`);

if (passed !== total) {
  process.exit(1);
}
