import { spawnSync } from "node:child_process";

const commands = [
  "npm run avatar:deformation:verify",
  "npm run avatar:root:verify",
  "npm run avatar:behavior:verify",
  "npm run avatar:facial:verify",
  "npm run avatar:ai4animation:status",
  "npm run avatar:browser",
];

const results = [];

for (const command of commands) {
  const startedAt = Date.now();
  const result = spawnSync(command, {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: true,
  });

  results.push({
    command,
    status: result.status,
    durationMs: Date.now() - startedAt,
  });

  if (result.status !== 0) {
    process.stdout.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    throw new Error(`Receptionist avatar verification failed at "${command}".`);
  }
}

console.log(
  JSON.stringify(
    {
      status: "ready",
      summary: "Ebee receptionist avatar runtime checks passed.",
      checks: results,
    },
    null,
    2,
  ),
);
