// Record PIA's built-in `demo` reel as a seamless looping mp4 (+ poster).
//
// The reel is deterministic and periodic (~70s). We record ~2.3 loops, locate
// the loop period from the neofetch marker, find two near-identical "held"
// frames one period apart (the fresh prompt at a scene break), and trim exactly
// between them so the loop is seamless. Output: 1600x840, 25fps, H.264.
//
//   node record-demo.mjs                 # → content/{english,swedish}/works/pia
//   node record-demo.mjs --url http://127.0.0.1:5199/   # local dev server
//   node record-demo.mjs --out /tmp/x    # write to /tmp/x instead (testing)
//
// Produces: 02-tour.mp4, 02-tour-poster.png
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { launch, openScreen, install, FFMPEG, URL } from "./lib.mjs";

const VW = 2400,
  VH = 1260,
  FONT = 48;
const MARKER = "VFS + command registry"; // unique to the neofetch/identity scene
const OUT_W = 1600,
  OUT_H = 840,
  FPS = 25,
  CRF = 23;

const work = mkdtempSync(resolve(tmpdir(), "pia-demo-"));
const videoDir = resolve(work, "video");
mkdirSync(videoDir, { recursive: true });

console.log("Recording `demo` from", URL, "…");
const browser = await launch();
const { ctx, page } = await openScreen(browser, {
  width: VW,
  height: VH,
  font: FONT,
  record: videoDir,
});
const t0 = Date.now(); // ≈ video t=0 (recording started at context/newPage)
await page.keyboard.type("demo", { delay: 30 });
await page.keyboard.press("Enter");

// Sample the reel: mark each time the neofetch marker (re)appears — those are
// loop boundaries — until we have 3 (two full periods) plus a margin. On the
// first appearance, after a short settle, grab a reference screenshot of the
// rendered identity; we later find the matching video frame by CONTENT (robust
// against any offset between wall-clock sampling and the video timeline).
const edges = [];
let present = false;
const refPath = resolve(work, "ref.png");
let haveRef = false;
while (Date.now() - t0 < 175000 && edges.length < 3) {
  const now = await page.evaluate((m) => {
    const h = document.querySelector(".term-app");
    return !!h && (h.textContent || "").includes(m);
  }, MARKER);
  if (now && !present) edges.push(Date.now() - t0);
  if (now && !haveRef) {
    await page.waitForTimeout(400); // let the identity finish rendering
    await page.screenshot({ path: refPath });
    haveRef = true;
  }
  present = now;
  await page.waitForTimeout(50);
}
await ctx.close();
const webm = await page.video().path();
await browser.close();

if (edges.length < 3) {
  console.error("Could not detect 3 loop edges (got", edges.length, ").");
  process.exit(2);
}
const periodMs = Math.round((edges[2] - edges[1] + (edges[1] - edges[0])) / 2);
const periodFr = Math.round((periodMs / 1000) * FPS);
console.log(
  `Loop period ≈ ${(periodMs / 1000).toFixed(2)}s (${periodFr} frames)`
);

// Extract low-res grayscale frames spanning both identity edges (plus margin),
// and the reference identity screenshot at the same size.
const W = 48,
  H = 25,
  FB = W * H;
const winStart = Math.max(0, edges[1] / 1000 - 2.5);
const winDur = (edges[2] - edges[1]) / 1000 + 5;
const raw = resolve(work, "win.gray");
execFileSync(
  FFMPEG,
  [
    "-y",
    "-ss",
    String(winStart),
    "-i",
    webm,
    "-t",
    String(winDur),
    "-vf",
    `fps=${FPS},scale=${W}:${H},format=gray`,
    "-f",
    "rawvideo",
    "-pix_fmt",
    "gray",
    raw,
  ],
  { stdio: "ignore" }
);
const refRaw = resolve(work, "ref.gray");
execFileSync(
  FFMPEG,
  [
    "-y",
    "-i",
    refPath,
    "-vf",
    `scale=${W}:${H},format=gray`,
    "-f",
    "rawvideo",
    "-pix_fmt",
    "gray",
    refRaw,
  ],
  { stdio: "ignore" }
);
const buf = readFileSync(raw);
const ref = readFileSync(refRaw);
const N = Math.floor(buf.length / FB);
const frame = (n) => buf.subarray(n * FB, (n + 1) * FB);
const l1 = (a, b) => {
  let s = 0;
  for (let k = 0; k < FB; k++) s += Math.abs(a[k] - b[k]);
  return s;
};

const appear = Math.round((edges[1] / 1000 - winStart) * FPS);
const holdDiff = (n) => (n > 0 ? l1(frame(n), frame(n - 1)) : 1e9);

// Loop seam: the reel begins with a fresh prompt just before it types
// `neofetch`, so the cleanest SEAMLESS cut is on that static prompt hold (the
// identity itself has a blinking cursor that won't pixel-align across a
// period). Search static frames just before the identity for the (start,
// length) with the smallest first↔last difference.
let best = null;
for (let n = Math.max(1, appear - 75); n <= appear + 12 && n < N; n++) {
  for (let P = periodFr - 22; P <= periodFr + 22; P++) {
    const j = n + P;
    if (j >= N) break;
    const score = l1(frame(n), frame(j)) + 0.3 * holdDiff(n);
    if (!best || score < best.score) best = { i: n, P, score };
  }
}
if (!best) {
  console.error("No seamless seam found.");
  process.exit(2);
}
const startSec = winStart + best.i / FPS;

// Poster: the identity frame (best match to the reference), so the still shown
// before playback / on reduced-motion is PIA introducing itself — even though
// the loop itself is cut on the fresh-prompt hold a moment earlier.
let posterFr = appear,
  posterBest = Infinity;
for (let n = Math.max(0, appear - 50); n <= appear + 60 && n < N; n++) {
  const d = l1(frame(n), ref);
  if (d < posterBest) (posterBest = d), (posterFr = n);
}
const posterSec = winStart + posterFr / FPS;
console.log(
  `Seam: start ${startSec.toFixed(3)}s, ${best.P} frames (${(
    best.P / FPS
  ).toFixed(2)}s); poster at ${posterSec.toFixed(3)}s`
);

// Encode the seamless loop, and the poster from the identity frame.
const mp4 = resolve(work, "02-tour.mp4");
const poster = resolve(work, "02-tour-poster.png");
execFileSync(
  FFMPEG,
  [
    "-y",
    "-ss",
    startSec.toFixed(3),
    "-i",
    webm,
    "-frames:v",
    String(best.P),
    "-vf",
    `scale=${OUT_W}:${OUT_H}:flags=lanczos,fps=${FPS}`,
    "-c:v",
    "libx264",
    "-crf",
    String(CRF),
    "-preset",
    "slow",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-an",
    mp4,
  ],
  { stdio: "ignore" }
);
execFileSync(
  FFMPEG,
  [
    "-y",
    "-ss",
    posterSec.toFixed(3),
    "-i",
    webm,
    "-frames:v",
    "1",
    "-vf",
    `scale=${OUT_W}:${OUT_H}:flags=lanczos`,
    poster,
  ],
  { stdio: "ignore" }
);

console.log("Installing:");
install(mp4, "02-tour.mp4");
install(poster, "02-tour-poster.png");
rmSync(work, { recursive: true, force: true });
console.log("Done.");
