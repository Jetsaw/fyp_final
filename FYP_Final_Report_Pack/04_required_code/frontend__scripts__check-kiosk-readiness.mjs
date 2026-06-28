const frontendUrl = process.env.FRONTEND_URL ?? "http://127.0.0.1:5174";
const backendUrl = process.env.VITE_API_BASE || process.env.BACKEND_URL || "http://127.0.0.1:8000";

async function checkUrl(label, url, options = {}) {
  try {
    const response = await fetch(url, options);
    return {
      label,
      url,
      ok: response.ok,
      status: response.status,
    };
  } catch (error) {
    return {
      label,
      url,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

const checks = [
  await checkUrl("frontend", frontendUrl),
  await checkUrl("avatar asset", `${frontendUrl}/avatar/exact/idle.png`),
  await checkUrl("backend /health", `${backendUrl}/health`),
  await checkUrl("backend /api/health", `${backendUrl}/api/health`),
];

console.log("Hive kiosk readiness\n");

for (const check of checks) {
  if (check.ok) {
    console.log(`OK   ${check.label}: ${check.status} ${check.url}`);
  } else {
    const detail = "status" in check ? check.status : check.error;
    console.log(`WARN ${check.label}: ${detail} ${check.url}`);
  }
}

const frontendReady = checks[0].ok && checks[1].ok;
const backendReady = checks[2].ok || checks[3].ok;

console.log("");
console.log(`Frontend ready: ${frontendReady ? "yes" : "no"}`);
console.log(`Backend ready: ${backendReady ? "yes" : "no"}`);

if (!frontendReady) {
  process.exitCode = 1;
}
