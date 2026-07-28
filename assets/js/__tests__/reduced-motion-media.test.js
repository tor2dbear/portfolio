/**
 * Tests for reduced-motion-media.js — pauses autoplay <video> and SMIL SVG
 * animations when the visitor prefers reduced motion (OS query or the site's
 * data-effect-reduced-motion toggle).
 */

describe("reduced-motion-media", () => {
  let mmReduce;
  let mmChangeHandlers;
  let mutationCallback;
  let animSvg;
  let staticSvg;

  function setupMatchMedia() {
    mmChangeHandlers = [];
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      get matches() {
        return query === "(prefers-reduced-motion: reduce)" ? mmReduce : false;
      },
      media: query,
      addEventListener: (evt, cb) => {
        if (evt === "change") {
          mmChangeHandlers.push(cb);
        }
      },
      removeEventListener: jest.fn(),
    }));
  }

  function setupMutationObserver() {
    mutationCallback = null;
    global.MutationObserver = jest.fn(function (cb) {
      mutationCallback = cb;
      this.observe = jest.fn();
      this.disconnect = jest.fn();
    });
  }

  function load() {
    require("../reduced-motion-media");
    document.dispatchEvent(new Event("DOMContentLoaded"));
  }

  beforeEach(() => {
    document.documentElement.removeAttribute("data-effect-reduced-motion");
    document.body.innerHTML =
      "<video autoplay></video>" +
      '<svg id="anim"><animate attributeName="x" /></svg>' +
      '<svg id="static"></svg>';
    mmReduce = false;
    setupMatchMedia();
    setupMutationObserver();

    jest
      .spyOn(window.HTMLMediaElement.prototype, "play")
      .mockResolvedValue(undefined);
    jest
      .spyOn(window.HTMLMediaElement.prototype, "pause")
      .mockImplementation(() => {});

    animSvg = document.getElementById("anim");
    staticSvg = document.getElementById("static");
    [animSvg, staticSvg].forEach((s) => {
      s.pauseAnimations = jest.fn();
      s.unpauseAnimations = jest.fn();
    });

    jest.resetModules();
  });

  test("pauses the video and the SMIL svg when the OS prefers reduced motion", () => {
    mmReduce = true;
    load();
    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    expect(animSvg.pauseAnimations).toHaveBeenCalled();
    // an svg with no <animate> is left alone
    expect(staticSvg.pauseAnimations).not.toHaveBeenCalled();
  });

  test("plays the video and unpauses the SMIL svg when motion is allowed", () => {
    mmReduce = false;
    load();
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
    expect(animSvg.unpauseAnimations).toHaveBeenCalled();
  });

  test("honours the manual reduced-motion toggle", () => {
    document.documentElement.setAttribute("data-effect-reduced-motion", "on");
    load();
    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    expect(animSvg.pauseAnimations).toHaveBeenCalled();
  });

  test("re-applies when the reduced-motion toggle flips", () => {
    load();
    window.HTMLMediaElement.prototype.pause.mockClear();
    animSvg.pauseAnimations.mockClear();
    document.documentElement.setAttribute("data-effect-reduced-motion", "on");
    mutationCallback([{ attributeName: "data-effect-reduced-motion" }]);
    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    expect(animSvg.pauseAnimations).toHaveBeenCalled();
  });

  test("re-applies when the OS reduced-motion preference changes", () => {
    load();
    window.HTMLMediaElement.prototype.pause.mockClear();
    mmReduce = true;
    expect(mmChangeHandlers.length).toBeGreaterThan(0);
    mmChangeHandlers.forEach((cb) => cb());
    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });

  test("exposes an idempotent refresh seam", () => {
    load();
    expect(typeof window.ReducedMotionMedia.refresh).toBe("function");
    mmReduce = true;
    window.HTMLMediaElement.prototype.pause.mockClear();
    window.ReducedMotionMedia.refresh();
    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });
});
