// Capture the PIA case-study screenshots from the running app.
//
//   node capture-shots.mjs            # all → content/{english,swedish}/works/pia
//   node capture-shots.mjs hero nano  # only the named shots
//   node capture-shots.mjs --url http://127.0.0.1:5199/
//   node capture-shots.mjs --out /tmp/x
//
// Produces (filenames match the case study):
//   hero → 01-hero-session.png   (whoareyou, 2400x1260 → scaled to 1600x840)
//   nano → 04-editor-nano.png    (nano editor, 2400x1440)
//   2048 → 05-game-2048.png      (the game; see the crop note in README)
import { execFileSync } from "node:child_process";
import { rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { launch, openScreen, runCmd, install, FFMPEG } from "./lib.mjs";

const want = process.argv
  .slice(2)
  .filter((a) => !a.startsWith("--") && !isFlagVal(a));
const pick = (name) => want.length === 0 || want.includes(name);
function isFlagVal(a) {
  const i = process.argv.indexOf(a);
  return i > 1 && process.argv[i - 1] && process.argv[i - 1].startsWith("--");
}

const work = mkdtempSync(resolve(tmpdir(), "pia-shots-"));
const browser = await launch();

// --- hero: whoareyou, airy padding, scaled down to the hero size -------------
if (pick("hero")) {
  console.log("hero → 01-hero-session.png");
  const { ctx, page } = await openScreen(browser, {
    width: 2400,
    height: 1260,
    font: 48,
    padding: 96,
  });
  await runCmd(page, "clear", { wait: 300 });
  await runCmd(page, "whoareyou", { delay: 60, wait: 500 });
  const shot = resolve(work, "hero.png");
  await page.screenshot({ path: shot });
  await ctx.close();
  const out = resolve(work, "01-hero-session.png");
  execFileSync(
    FFMPEG,
    ["-y", "-i", shot, "-vf", "scale=1600:840:flags=lanczos", out],
    { stdio: "ignore" }
  );
  install(out, "01-hero-session.png");
}

// --- nano: the real editor with a few lines typed ----------------------------
if (pick("nano")) {
  console.log("nano → 04-editor-nano.png");
  const { ctx, page } = await openScreen(browser, {
    width: 1200,
    height: 720,
    dsf: 2,
    font: 24,
  });
  await runCmd(page, "nano notes.md", { delay: 20, wait: 600 });
  for (const line of [
    "# PIA",
    "a little computer in the browser.",
    "- files, folders, and real Python",
  ]) {
    await page.keyboard.type(line, { delay: 18 });
    await page.keyboard.press("Enter");
  }
  await page.waitForTimeout(400);
  const out = resolve(work, "04-editor-nano.png");
  await page.screenshot({ path: out });
  await ctx.close();
  install(out, "04-editor-nano.png");
}

// --- 2048: install the package, play a few moves, shot the app ---------------
if (pick("2048")) {
  console.log("2048 → 05-game-2048.png");
  const { ctx, page } = await openScreen(browser, {
    width: 1200,
    height: 720,
    dsf: 2,
    font: 24,
  });
  await runCmd(page, "brew install 2048", { delay: 15, wait: 1200 });
  await runCmd(page, "2048", { delay: 20, wait: 1200 });
  for (const k of ["ArrowRight", "ArrowUp", "ArrowLeft", "ArrowDown"]) {
    await page.keyboard.press(k);
    await page.waitForTimeout(250);
  }
  const out = resolve(work, "05-game-2048.png");
  // Screenshot the app host; crop to the board if it needs tightening (see
  // README — the committed asset is 1040x760).
  const app = page.locator(".term-app").first();
  await ((await app.count()) ? app : page).screenshot({ path: out });
  await ctx.close();
  install(out, "05-game-2048.png");
}

await browser.close();
rmSync(work, { recursive: true, force: true });
console.log("Done.");
