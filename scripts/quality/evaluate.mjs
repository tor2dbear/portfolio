#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import YAML from "yaml";

function parseArgs(argv) {
  const args = new Map();
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : true;
    args.set(key, value);
    if (value !== true) i += 1;
  }
  return args;
}

function asInt(value, fallback = null) {
  if (value == null) return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function safeMarkdown(text) {
  return String(text ?? "").replace(/\r\n/g, "\n");
}

function normalizeRoute(route) {
  if (!route) return "/";
  const withLeading = route.startsWith("/") ? route : `/${route}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

function urlToRoute(urlString) {
  try {
    const url = new URL(urlString);
    return normalizeRoute(url.pathname);
  } catch {
    return null;
  }
}

async function loadPolicy(policyPath) {
  const raw = await fs.readFile(policyPath, "utf8");
  const parsed = YAML.parse(raw);
  if (!parsed || typeof parsed !== "object") throw new Error("Invalid policy YAML");
  return parsed;
}

async function listFilesRecursive(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listFilesRecursive(fullPath)));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

async function loadJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function getPolicyCategory(policy, key) {
  return policy?.policy?.blockers?.lighthouse?.categories?.[key] ?? null;
}

function scoreToPoints(score) {
  if (score == null) return null;
  const points = Math.round(Number(score) * 100);
  return Number.isFinite(points) ? points : null;
}

function pickTopOpportunities(lhr, maxItems = 5) {
  const items = [];
  const audits = lhr?.audits ?? {};
  for (const [auditId, audit] of Object.entries(audits)) {
    const details = audit?.details;
    if (!details || details.type !== "opportunity") continue;
    const savingsMs = asInt(details.overallSavingsMs, 0);
    const savingsBytes = asInt(details.overallSavingsBytes, 0);
    const weight = Math.max(savingsMs, Math.round(savingsBytes / 1024));
    if (weight <= 0) continue;
    items.push({
      auditId,
      title: audit?.title ?? auditId,
      weight,
      savingsMs,
      savingsBytes,
    });
  }

  items.sort((a, b) => b.weight - a.weight);
  return items.slice(0, maxItems);
}

async function parseLighthouse(lighthouseDir) {
  const files = await listFilesRecursive(lighthouseDir);
  const lhrFiles = files.filter((f) => path.basename(f).startsWith("lhr-") && f.endsWith(".json"));
  const results = [];

  for (const filePath of lhrFiles) {
    const lhr = await loadJson(filePath);
    const route = urlToRoute(lhr?.finalUrl ?? lhr?.requestedUrl) ?? "unknown";
    results.push({
      route,
      finalUrl: lhr?.finalUrl ?? null,
      requestedUrl: lhr?.requestedUrl ?? null,
      categories: {
        performance: scoreToPoints(lhr?.categories?.performance?.score),
        accessibility: scoreToPoints(lhr?.categories?.accessibility?.score),
        bestPractices: scoreToPoints(lhr?.categories?.["best-practices"]?.score),
        seo: scoreToPoints(lhr?.categories?.seo?.score),
      },
      opportunities: pickTopOpportunities(lhr),
    });
  }

  results.sort((a, b) => a.route.localeCompare(b.route));
  return results;
}

async function parseAxe(axeFile) {
  const data = await loadJson(axeFile);
  const runs = Array.isArray(data?.runs) ? data.runs : [];
  return runs.map((run) => ({
    route: normalizeRoute(run?.route ?? urlToRoute(run?.url) ?? "/"),
    url: run?.url ?? null,
    violations: Array.isArray(run?.violations) ? run.violations : [],
  }));
}

function countAxeByImpact(axeRuns) {
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0, unknown: 0 };
  for (const run of axeRuns) {
    for (const v of run.violations) {
      const impact = v?.impact ?? "unknown";
      if (impact in counts) counts[impact] += 1;
      else counts.unknown += 1;
    }
  }
  return counts;
}

function computeBlockers({ policy, lighthouseRuns, axeRuns }) {
  const blockers = [];

  // Missing tools are blockers to avoid false greens in PR.
  if (!lighthouseRuns) blockers.push({ type: "tool", tool: "lighthouse", message: "Missing Lighthouse results" });
  if (!axeRuns) blockers.push({ type: "tool", tool: "axe", message: "Missing axe results" });

  // Lighthouse category minimums
  if (lighthouseRuns) {
    for (const run of lighthouseRuns) {
      for (const [categoryKey, score] of Object.entries(run.categories)) {
        const categoryPolicy = getPolicyCategory(policy, categoryKey);
        const minScore = asInt(categoryPolicy?.minScore, null);
        if (minScore == null || score == null) continue;
        if (score < minScore) {
          blockers.push({
            type: "lighthouse",
            route: run.route,
            category: categoryKey,
            score,
            minScore,
            message: `${categoryKey} score ${score} < minScore ${minScore} on ${run.route}`,
          });
        }
      }
    }
  }

  // axe impacts
  if (axeRuns) {
    const blockedImpacts = new Set(policy?.policy?.blockers?.axeImpacts ?? []);
    for (const run of axeRuns) {
      for (const v of run.violations) {
        const impact = v?.impact ?? "unknown";
        if (!blockedImpacts.has(impact)) continue;
        blockers.push({
          type: "axe",
          route: run.route,
          impact,
          ruleId: v?.id ?? "unknown",
          help: v?.help ?? null,
          helpUrl: v?.helpUrl ?? null,
          message: `axe ${impact}: ${v?.id ?? "unknown"} on ${run.route}`,
        });
      }
    }
  }

  return blockers;
}

function formatMarkdown({ policy, mode, lighthouseRuns, axeRuns, blockers, runUrl }) {
  const lhByRoute = new Map((lighthouseRuns ?? []).map((r) => [r.route, r]));
  const axeCounts = axeRuns ? countAxeByImpact(axeRuns) : null;

  const routes = policy?.routes?.[mode] ?? [];
  const lines = [];
  lines.push("## CI Quality Report");
  lines.push("");
  lines.push(`Mode: \`${mode}\``);
  if (runUrl) lines.push(`Run: ${runUrl}`);
  lines.push("");

  lines.push(`### Blockers: ${blockers.length}`);
  if (blockers.length === 0) {
    lines.push("- None");
  } else {
    const top = blockers.slice(0, 10);
    for (const b of top) {
      if (b.type === "lighthouse") {
        lines.push(`- Lighthouse \`${b.category}\` on \`${b.route}\`: **${b.score}** (min ${b.minScore})`);
      } else if (b.type === "axe") {
        lines.push(`- axe **${b.impact}** \`${b.ruleId}\` on \`${b.route}\``);
      } else {
        lines.push(`- ${b.message}`);
      }
    }
    if (blockers.length > top.length) lines.push(`- …and ${blockers.length - top.length} more`);
  }
  lines.push("");

  lines.push("### Lighthouse (scores)");
  if (!lighthouseRuns) {
    lines.push("- Missing results");
  } else {
    for (const route of routes) {
      const normalized = normalizeRoute(route);
      const run = lhByRoute.get(normalized);
      if (!run) {
        lines.push(`- \`${normalized}\`: missing`);
        continue;
      }
      const c = run.categories;
      lines.push(
        `- \`${normalized}\`: Perf ${c.performance ?? "—"}, A11y ${c.accessibility ?? "—"}, BP ${
          c.bestPractices ?? "—"
        }, SEO ${c.seo ?? "—"}`
      );
    }
  }
  lines.push("");

  lines.push("### axe (violations)");
  if (!axeRuns) {
    lines.push("- Missing results");
  } else {
    lines.push(
      `- critical ${axeCounts.critical}, serious ${axeCounts.serious}, moderate ${axeCounts.moderate}, minor ${axeCounts.minor}`
    );
  }
  lines.push("");

  // Backlog candidates: top opportunities (Lighthouse) + non-blocking axe impacts
  lines.push("### Backlog candidates (top)");
  const backlogItems = [];

  if (lighthouseRuns) {
    for (const run of lighthouseRuns) {
      for (const opp of run.opportunities ?? []) {
        backlogItems.push({
          kind: "lighthouse",
          route: run.route,
          title: opp.title,
          weight: opp.weight,
        });
      }
    }
  }

  if (axeRuns) {
    const fixSoonImpacts = new Set(policy?.policy?.fixSoon?.axeImpacts ?? []);
    const backlogImpacts = new Set(policy?.policy?.backlog?.axeImpacts ?? []);
    const allowed = new Set([...fixSoonImpacts, ...backlogImpacts]);
    for (const run of axeRuns) {
      for (const v of run.violations) {
        const impact = v?.impact ?? "unknown";
        if (!allowed.has(impact)) continue;
        backlogItems.push({
          kind: "axe",
          route: run.route,
          title: `${impact}: ${v?.id ?? "unknown"}`,
          weight: impact === "moderate" ? 50 : 10,
        });
      }
    }
  }

  backlogItems.sort((a, b) => b.weight - a.weight);
  const topBacklog = backlogItems.slice(0, 10);
  if (topBacklog.length === 0) lines.push("- None");
  for (const item of topBacklog) {
    lines.push(`- ${item.kind} on \`${item.route}\`: ${safeMarkdown(item.title)}`);
  }

  lines.push("");
  lines.push("---");
  lines.push("<sub>Generated by CI. This comment is updated (no spam).</sub>");

  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv);
  const policyPath = String(args.get("policy") ?? "quality-policy.yml");
  const mode = String(args.get("mode") ?? "full");
  const lighthouseDir = args.get("lighthouseDir") ? String(args.get("lighthouseDir")) : null;
  const axeFile = args.get("axeFile") ? String(args.get("axeFile")) : null;
  const outDir = String(args.get("outDir") ?? "artifacts/quality");
  const writeStepSummary = Boolean(args.get("stepSummary") ?? false);

  const policy = await loadPolicy(policyPath);

  let lighthouseRuns = null;
  let axeRuns = null;

  if (lighthouseDir) {
    try {
      lighthouseRuns = await parseLighthouse(lighthouseDir);
    } catch (err) {
      lighthouseRuns = null;
      // eslint-disable-next-line no-console
      console.error(`Failed to parse Lighthouse results: ${err?.message ?? err}`);
    }
  }

  if (axeFile) {
    try {
      axeRuns = await parseAxe(axeFile);
    } catch (err) {
      axeRuns = null;
      // eslint-disable-next-line no-console
      console.error(`Failed to parse axe results: ${err?.message ?? err}`);
    }
  }

  const blockers = computeBlockers({ policy, lighthouseRuns, axeRuns });
  const runUrl =
    process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : null;

  const markdown = formatMarkdown({ policy, mode, lighthouseRuns, axeRuns, blockers, runUrl });
  const summary = {
    generatedAt: new Date().toISOString(),
    mode,
    blockers,
    lighthouse: lighthouseRuns,
    axe: axeRuns
      ? {
          runs: axeRuns.map((r) => ({ route: r.route, url: r.url, violations: r.violations })),
          counts: countAxeByImpact(axeRuns),
        }
      : null,
  };

  await fs.mkdir(outDir, { recursive: true });
  const mdPath = path.join(outDir, "summary.md");
  const jsonPath = path.join(outDir, "summary.json");
  await fs.writeFile(mdPath, markdown, "utf8");
  await fs.writeFile(jsonPath, JSON.stringify(summary, null, 2), "utf8");

  if (writeStepSummary && process.env.GITHUB_STEP_SUMMARY) {
    await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`, "utf8");
  }

  // Print path for CI logs
  // eslint-disable-next-line no-console
  console.log(`Wrote ${mdPath} and ${jsonPath}`);
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(2);
  });
}
