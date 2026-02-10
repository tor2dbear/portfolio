#!/usr/bin/env node
import fs from "node:fs/promises";
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

async function main() {
  const args = parseArgs(process.argv);
  const policyPath = String(args.get("policy") ?? "quality-policy.yml");
  const mode = String(args.get("mode") ?? "full");
  const raw = await fs.readFile(policyPath, "utf8");
  const policy = YAML.parse(raw);
  const routes = policy?.routes?.[mode];
  if (!Array.isArray(routes) || routes.length === 0) {
    throw new Error(`No routes found for mode "${mode}" in ${policyPath}`);
  }
  process.stdout.write(routes.join(","));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err?.message ?? err);
  process.exit(2);
});

