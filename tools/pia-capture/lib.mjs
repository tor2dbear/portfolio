// Shared helpers for the PIA capture scripts.
//
// All capture targets the running PIA app (a Chromium page driven by
// Playwright), sets the terminal font size, runs commands, and writes the
// resulting asset into BOTH language bundles (the media is identical in
// content/english/works/pia and content/swedish/works/pia).
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { copyFileSync, mkdirSync } from "node:fs";
import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO = resolve(HERE, "..", "..");
export const BUNDLES = [
  resolve(REPO, "content/english/works/pia"),
  resolve(REPO, "content/swedish/works/pia"),
];
export const FFMPEG = ffmpegPath;
export const FFPROBE = ffprobeStatic.path;

// --url <URL> or PIA_URL env. Default: the deployed site. Point it at a local
// dev server (http://127.0.0.1:5199/) to capture un-deployed changes.
export const URL =
  argVal("--url") || process.env.PIA_URL || "https://pia.tor2dbear.com/";
// PIA_CHROMIUM env overrides the browser binary; otherwise Playwright uses the
// one installed by `npx playwright install chromium`.
const EXEC = process.env.PIA_CHROMIUM || undefined;

export function argVal(flag, def) {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

export function launch() {
  return chromium.launch({ executablePath: EXEC, args: ["--no-sandbox"] });
}

// Open the PIA app, force the terminal font (and optional padding), and click
// to focus. Returns { ctx, page }. Pass `record` (a dir) to record video.
export async function openScreen(
  browser,
  { width, height, dsf = 1, font, padding = null, record = null }
) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: dsf,
    colorScheme: "dark",
    ...(record
      ? { recordVideo: { dir: record, size: { width, height } } }
      : {}),
  });
  const page = await ctx.newPage();
  // "load", not "networkidle": the live app holds a Supabase websocket open, so
  // the network never goes idle. #screen + the settle wait below gate readiness.
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForSelector("#screen");
  const pad =
    padding != null
      ? ` padding:${padding}px !important; box-sizing:border-box;`
      : "";
  await page.addStyleTag({
    content: `#screen{ --font-size:${font}px !important;${pad} }`,
  });
  await page.waitForTimeout(1600);
  await page.click("#screen");
  await page.waitForTimeout(150);
  return { ctx, page };
}

// Type a command line and press Enter.
export async function runCmd(page, text, { delay = 25, wait = 500 } = {}) {
  await page.keyboard.type(text, { delay });
  await page.keyboard.press("Enter");
  if (wait) await page.waitForTimeout(wait);
}

// Copy a produced file into both language bundles under `filename`, unless
// --out <dir> was given (then write only there, for testing without touching
// the committed assets).
export function install(srcPath, filename) {
  const outOverride = argVal("--out");
  const targets = outOverride ? [resolve(outOverride)] : BUNDLES;
  for (const dir of targets) {
    mkdirSync(dir, { recursive: true });
    copyFileSync(srcPath, resolve(dir, filename));
    console.log("  →", resolve(dir, filename));
  }
}
