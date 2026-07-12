/**
 * Dependency-audit summary for the sticky PR comment.
 *
 * Runs `npm audit` and appends a short advisory count to the CI quality summary
 * (artifacts/quality/summary.md), which the "Update PR comment (sticky)" step
 * posts on every PR. The point is visibility in the development loop — a
 * dependency advisory shows up where the work happens, in the PR conversation —
 * NOT a gate: this never fails the build, and moderate/low advisories that the
 * push-job `npm audit --audit-level=high` step ignores are surfaced here.
 *
 * Usage: node scripts/quality/audit-summary.mjs [--outDir artifacts/quality]
 */
import { spawnSync } from "node:child_process";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

// `npm audit --json` exits non-zero when advisories exist; we only want the
// report, so ignore the status and parse stdout. Returns the severity counts
// or null if audit couldn't run (offline, npm error, unexpected shape).
function auditCounts() {
  const res = spawnSync("npm", ["audit", "--json"], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  if (!res.stdout) {
    return null;
  }
  try {
    const data = JSON.parse(res.stdout);
    const v = data && data.metadata && data.metadata.vulnerabilities;
    if (!v) {
      return null;
    }
    return {
      info: v.info || 0,
      low: v.low || 0,
      moderate: v.moderate || 0,
      high: v.high || 0,
      critical: v.critical || 0,
      total: v.total || 0,
    };
  } catch {
    return null;
  }
}

function section(counts) {
  if (!counts) {
    return [
      "## 🔒 Dependency audit",
      "",
      "`npm audit` could not run (offline or npm error) — advisories not checked.",
      "",
    ].join("\n");
  }
  const actionable = counts.moderate + counts.high + counts.critical;
  const headline =
    actionable === 0
      ? "✅ `npm audit`: no moderate or higher advisories."
      : `⚠️ \`npm audit\`: **${counts.moderate} moderate**, ${counts.high} high, ${counts.critical} critical.`;
  return [
    "## 🔒 Dependency audit",
    "",
    headline,
    "",
    `<sub>${counts.total} total advisories (incl. low/info). Reported, not gated — see docs/testing-gaps.md.</sub>`,
    "",
  ].join("\n");
}

async function main() {
  const outDir = arg("outDir", "artifacts/quality");
  const md = section(auditCounts());

  await mkdir(outDir, { recursive: true });
  const summaryPath = path.join(outDir, "summary.md");
  // Append so this sits under the existing quality report in the sticky comment.
  await appendFile(summaryPath, `\n${md}`, "utf8");

  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `${md}\n`, "utf8");
  }

  // eslint-disable-next-line no-console
  console.log(md);
}

main().catch((err) => {
  // Never fail the build over the audit summary.
  // eslint-disable-next-line no-console
  console.error(`audit-summary: ${err?.message ?? err}`);
});
