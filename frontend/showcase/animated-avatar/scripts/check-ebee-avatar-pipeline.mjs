import { spawnSync } from "node:child_process";

const npmCommand = "npm";
const steps = [
  ["sourceAssetSync", npmCommand, ["run", "avatar:source:sync"]],
  ["motionExport", npmCommand, ["run", "avatar:motion:export"]],
  ["motionVerify", npmCommand, ["run", "avatar:motion:verify"]],
  ["motionImportCheck", npmCommand, ["run", "avatar:motion:import:check"]],
  ["rigExport", npmCommand, ["run", "avatar:rig:export"]],
  ["rigArtifact", npmCommand, ["run", "avatar:rig:artifact"]],
  ["ai4animationContractExport", npmCommand, ["run", "avatar:ai4animation:contract:export"]],
  ["ai4animationContractVerify", npmCommand, ["run", "avatar:ai4animation:contract:verify"]],
  ["ai4animationSchemaExport", npmCommand, ["run", "avatar:ai4animation:schema:export"]],
  ["ai4animationSchemaVerify", npmCommand, ["run", "avatar:ai4animation:schema:verify"]],
  ["ai4animationHandoffVerify", npmCommand, ["run", "avatar:ai4animation:handoff:verify"]],
  ["ai4animationUnityExporterVerify", npmCommand, ["run", "avatar:ai4animation:unity-exporter:verify"]],
  ["ai4animationUnityProjectPrepareVerify", npmCommand, ["run", "avatar:ai4animation:unity-project:prepare:verify"]],
  ["ai4animationUnityExporterInstallerVerify", npmCommand, ["run", "avatar:ai4animation:unity-exporter:install:verify"]],
  ["ai4animationValidateCheck", npmCommand, ["run", "avatar:ai4animation:validate:check"]],
  ["ai4animationImportCheck", npmCommand, ["run", "avatar:ai4animation:import:check"]],
  ["ai4animationRuntimeCheck", npmCommand, ["run", "avatar:ai4animation:runtime:check"]],
  ["ai4animationPromoteCheck", npmCommand, ["run", "avatar:ai4animation:promote:check"]],
  ["ai4animationInstallCheck", npmCommand, ["run", "avatar:ai4animation:install:check"]],
  ["ai4animationGuardsCheck", npmCommand, ["run", "avatar:ai4animation:guards:check"]],
  ["manifestExport", npmCommand, ["run", "avatar:manifest:export"]],
  ["manifestVerify", npmCommand, ["run", "avatar:manifest:verify"]],
  ["controller", npmCommand, ["run", "avatar:controller"]],
  ["rig", npmCommand, ["run", "avatar:rig"]],
  ["browser", npmCommand, ["run", "avatar:browser"]],
  ["lint", npmCommand, ["run", "lint"]],
  ["build", npmCommand, ["run", "build"]],
  ["ai4animationHandoffExport", npmCommand, ["run", "avatar:ai4animation:handoff:export"]],
  ["ai4animationHandoffPackageVerify", npmCommand, ["run", "avatar:ai4animation:handoff:package:verify"]],
];

const results = [];

function runCommand(command, args) {
  if (process.platform === "win32") {
    return spawnSync("cmd.exe", ["/d", "/s", "/c", [command, ...args].join(" ")], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: "pipe",
    });
  }

  return spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: "pipe",
  });
}

for (const [name, command, args] of steps) {
  const startedAt = Date.now();
  const result = runCommand(command, args);
  const durationMs = Date.now() - startedAt;

  results.push({
    name,
    status: result.status === 0 ? "passed" : "failed",
    durationMs,
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) process.stderr.write(`${result.error.message}\n`);

  if (result.status !== 0) {
    console.error(
      JSON.stringify(
        {
          status: "failed",
          failedStep: name,
          results,
        },
        null,
        2,
      ),
    );
    process.exit(result.status ?? 1);
  }
}

console.log(
  JSON.stringify(
    {
      status: "passed",
      checks: results.length,
      results,
    },
    null,
    2,
  ),
);
