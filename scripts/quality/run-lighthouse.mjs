#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

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

function run(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", ...options });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

async function main() {
  const args = parseArgs(process.argv);
  const policyPath = String(args.get("policy") ?? "quality-policy.yml");
  const mode = String(args.get("mode") ?? "full");
  const baseUrl = String(args.get("baseUrl") ?? "");
  const outDir = String(args.get("outDir") ?? "artifacts/lighthouse");

  if (!baseUrl) throw new Error("--baseUrl is required");

  const raw = await fs.readFile(policyPath, "utf8");
  const policy = YAML.parse(raw);
  const routes = policy?.routes?.[mode];
  if (!Array.isArray(routes) || routes.length === 0) {
    throw new Error(`No routes found for mode "${mode}" in ${policyPath}`);
  }

  const urls = routes.map((r) => joinUrl(baseUrl, r));

  // LHCI writes to .lighthouseci in CWD; keep it predictable.
  await fs.rm(".lighthouseci", { recursive: true, force: true });

  const lhciArgs = [
    "-y",
    "--package=@lhci/cli@0.14.0",
    "lhci",
    "collect",
    "--numberOfRuns=1",
    "--settings.chromeFlags=--no-sandbox",
    ...urls.flatMap((url) => ["--url", url]),
  ];

  await run("npx", lhciArgs);

  await fs.mkdir(outDir, { recursive: true });
  const dest = path.join(outDir, ".lighthouseci");
  await fs.rm(dest, { recursive: true, force: true });
  await fs.cp(".lighthouseci", dest, { recursive: true });

  // eslint-disable-next-line no-console
  console.log(`Copied .lighthouseci -> ${dest}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err?.message ?? err);
  process.exit(2);
});

