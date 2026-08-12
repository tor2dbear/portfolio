/**
 * Regression tests for the standalone Méta-Matic hero (static/meta-matic-hero.html).
 *
 * Guards the P2 Codex finding: under reduced motion the hero renders once and
 * schedules no animation frame, so a later resize (which reassigns canvas.width/
 * height and clears the canvas) used to leave the hero BLANK until the next theme/
 * motion message. The fix repaints on resize; this test locks that in.
 *
 * The hero is an inline IIFE in a static HTML file, so we extract its <script>
 * and run it in jsdom with a mocked 2D context, matchMedia (reduced-motion on),
 * and a captured ResizeObserver callback.
 */

const fs = require("fs");
const path = require("path");

const HTML = fs.readFileSync(
  path.resolve(__dirname, "../../../static/meta-matic-hero.html"),
  "utf8"
);
const SCRIPT = (HTML.match(/<script>([\s\S]*?)<\/script>/) || [])[1];

function makeCtx() {
  const ctx = {};
  [
    "setTransform",
    "clearRect",
    "fillRect",
    "beginPath",
    "moveTo",
    "lineTo",
    "stroke",
    "fill",
    "arc",
    "closePath",
    "save",
    "restore",
    "clip",
    "rect",
    "strokeRect",
    "fillText",
    "setLineDash",
  ].forEach((m) => {
    ctx[m] = jest.fn();
  });
  ctx.measureText = jest.fn(() => ({ width: 0 }));
  return ctx;
}

describe("meta-matic standalone hero", () => {
  let ctx;
  let resizeObserverCb;

  function run() {
    new Function(SCRIPT)();
  }

  beforeEach(() => {
    document.body.innerHTML =
      '<div class="stage"><canvas id="c"></canvas></div>';
    const canvas = document.getElementById("c");
    ctx = makeCtx();
    canvas.getContext = () => ctx;
    canvas.getBoundingClientRect = () => ({
      width: 800,
      height: 500,
      top: 0,
      left: 0,
      right: 800,
      bottom: 500,
    });

    resizeObserverCb = null;
    window.ResizeObserver = class {
      constructor(cb) {
        resizeObserverCb = cb;
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    };
    window.requestAnimationFrame = jest.fn(() => 0);
    window.cancelAnimationFrame = jest.fn();
    window.devicePixelRatio = 2;
    // reduced motion ON (the failure mode); every other query is false.
    window.matchMedia = jest.fn((q) => ({
      matches: q === "(prefers-reduced-motion: reduce)",
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    }));
    window.location.hash = "#label";
  });

  test("extracts the hero script", () => {
    expect(SCRIPT).toBeTruthy();
  });

  test("renders once on load and schedules no animation frame under reduced motion", () => {
    run();
    expect(ctx.fillRect).toHaveBeenCalled(); // render() painted the paper ground
    expect(window.requestAnimationFrame).not.toHaveBeenCalled(); // no rAF loop
  });

  test("repaints after a resize under reduced motion (regression: blank hero)", () => {
    run();
    expect(typeof resizeObserverCb).toBe("function"); // ResizeObserver wired to the stage
    ctx.fillRect.mockClear();
    resizeObserverCb(); // the stage/iframe resized
    expect(ctx.fillRect).toHaveBeenCalled(); // repainted, not left blank
  });

  test("also repaints on a window resize event under reduced motion", () => {
    run();
    ctx.fillRect.mockClear();
    window.dispatchEvent(new Event("resize"));
    expect(ctx.fillRect).toHaveBeenCalled();
  });
});
