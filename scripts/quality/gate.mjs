#!/usr/bin/env node
import fs from "node:fs/promises";
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

async function main() {
  const args = parseArgs(process.argv);
  const summaryPath = String(args.get("summary") ?? "artifacts/quality/summary.json");
  const raw = await fs.readFile(summaryPath, "utf8");
  const summary = JSON.parse(raw);
  const blockers = Array.isArray(summary?.blockers) ? summary.blockers : [];

  if (blockers.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`BLOCKERS: ${blockers.length}`);
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log("BLOCKERS: 0");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(2);
});

