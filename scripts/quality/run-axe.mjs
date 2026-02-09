#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
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
  const playwrightVersion = String(args.get("playwrightVersion") ?? "1.49.1");
  const axePlaywrightVersion = String(args.get("axePlaywrightVersion") ?? "4.10.2");

  if (!baseUrl) throw new Error("--baseUrl is required");
  const routes = routesCsv
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
  if (routes.length === 0) throw new Error("--routes is required (comma-separated)");

  const runnerDir = await fs.mkdtemp(path.join(os.tmpdir(), "axe-runner-"));
  const runnerPath = path.join(runnerDir, "run-axe.cjs");

  // CJS runner so it works with npx-provided modules without ESM resolution quirks.
  const runnerSource = `
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;

function normalizeRoute(route) {
  if (!route) return '/';
  return route.startsWith('/') ? route : '/' + route;
}

function joinUrl(baseUrl, route) {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const r = normalizeRoute(route);
  return \`\${base}\${r}\`;
}

async function run() {
  const baseUrl = process.env.AXE_BASE_URL;
  const routes = JSON.parse(process.env.AXE_ROUTES_JSON);
  const outFile = process.env.AXE_OUT_FILE;

  const browser = await chromium.launch({ headless: true });
  const runs = [];

  try {
    for (const route of routes) {
      const url = joinUrl(baseUrl, route);
      const page = await browser.newPage();
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
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
    tool: 'axe',
    generatedAt: new Date().toISOString(),
    baseUrl,
    routes,
    runs,
  };
  await fs.writeFile(outFile, JSON.stringify(payload, null, 2), 'utf8');
  console.log(\`Wrote \${outFile}\`);
}

run().catch((err) => {
  console.error(err);
  process.exit(2);
});
`.trimStart();

  await fs.writeFile(runnerPath, runnerSource, "utf8");

  const env = {
    ...process.env,
    AXE_BASE_URL: baseUrl,
    AXE_ROUTES_JSON: JSON.stringify(routes),
    AXE_OUT_FILE: outFile,
  };

  await new Promise((resolve, reject) => {
    const child = spawn(
      "npx",
      [
        "-y",
        "-p",
        `playwright@${playwrightVersion}`,
        "-p",
        `@axe-core/playwright@${axePlaywrightVersion}`,
        "-c",
        `node "${runnerPath}"`,
      ],
      { stdio: "inherit", env }
    );
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`axe runner exited with code ${code}`));
    });
  });

  await fs.rm(runnerDir, { recursive: true, force: true });

  // eslint-disable-next-line no-console
  console.log(`axe completed for ${routes.length} route(s)`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(2);
});
