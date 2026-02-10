#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

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

function normalizeRoute(route) {
  if (!route) return "/";
  const withLeading = route.startsWith("/") ? route : `/${route}`;
  return withLeading;
}

function joinUrl(baseUrl, route) {
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const r = normalizeRoute(route);
  return `${base}${r}`;
}

async function main() {
  const args = parseArgs(process.argv);
  const baseUrl = String(args.get("baseUrl") ?? "");
  const routesCsv = String(args.get("routes") ?? "");
  const outFile = String(args.get("outFile") ?? "artifacts/axe/axe-results.json");

  if (!baseUrl) throw new Error("--baseUrl is required");
  const routes = routesCsv
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
  if (routes.length === 0) throw new Error("--routes is required (comma-separated)");

  const { chromium } = await import("playwright");
  const AxeBuilder = (await import("@axe-core/playwright")).default;

  const browser = await chromium.launch({ headless: true });
  const runs = [];

  try {
    for (const route of routes) {
      const url = joinUrl(baseUrl, route);
      const page = await browser.newPage();
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
        const results = await new AxeBuilder({ page }).analyze();
        runs.push({
          route,
          url,
          violations: results.violations ?? [],
          incomplete: results.incomplete ?? [],
          passes: results.passes ? results.passes.length : 0,
          inapplicable: results.inapplicable ? results.inapplicable.length : 0,
        });
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  await fs.mkdir(path.dirname(outFile), { recursive: true });
  const payload = {
    tool: "axe",
    generatedAt: new Date().toISOString(),
    baseUrl,
    routes,
    runs,
  };
  await fs.writeFile(outFile, JSON.stringify(payload, null, 2), "utf8");
  // eslint-disable-next-line no-console
  console.log(`Wrote ${outFile}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(2);
});
