const baseUrl = (process.env.STOP_SLOP_BASE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

const checks = [
  "How is ARM6113 Technical Calculus assessed?",
  "What is the Intelligent Robotics programme structure?",
  "Explain why a student should check prerequisites before Project II.",
];

const bannedPatterns = [
  { id: "em_dash", pattern: /\u2014/ },
  { id: "heres_the_thing", pattern: /\bhere'?s the thing\b/i },
  { id: "here_is_the_thing", pattern: /\bhere is the thing\b/i },
  { id: "heres_what", pattern: /\bhere'?s what\b/i },
  { id: "here_is_what", pattern: /\bhere is what\b/i },
  { id: "this_matters_because", pattern: /\bthis matters because\b/i },
  { id: "let_that_sink_in", pattern: /\blet that sink in\b/i },
  { id: "make_no_mistake", pattern: /\bmake no mistake\b/i },
  { id: "binary_pivot", pattern: /\bnot\s+[^.?!]+,\s*it'?s\s+/i },
];

async function ask(question) {
  const response = await fetch(`${baseUrl}/ask`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question, history: [] }),
  });

  const payload = await response.json();
  return {
    status: response.status,
    answer: payload.answer ?? "",
    route: payload.route,
  };
}

const failures = [];

console.log("Stop-slop output check");
console.log(`Base URL: ${baseUrl}`);
console.log("");

for (const question of checks) {
  const result = await ask(question);
  const matched = bannedPatterns.filter((entry) => entry.pattern.test(result.answer));
  const passed = result.status >= 200 && result.status < 300 && matched.length === 0 && result.answer.trim();

  console.log(`${passed ? "PASS" : "FAIL"} ${question}`);
  console.log(`     route=${result.route} answer=${result.answer.replace(/\s+/g, " ").slice(0, 220)}`);

  if (!passed) {
    failures.push({
      question,
      status: result.status,
      matched: matched.map((entry) => entry.id),
      answer: result.answer,
    });
  }
}

if (failures.length > 0) {
  console.error("");
  console.error(JSON.stringify({ failures }, null, 2));
  process.exit(1);
}
