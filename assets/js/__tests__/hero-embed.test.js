/**
 * Tests for hero-embed.js — mirrors the site's manual theme (data-mode) and
 * reduced-motion state into every embedded hero animation iframe, and exposes a
 * refresh seam for terminal in-place navigation.
 */

describe("hero-embed", () => {
  let mutationCallback;
  let reducedMotionChangeHandlers;

  function setupMatchMedia(reduceMatches) {
    reducedMotionChangeHandlers = [];
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches:
        query === "(prefers-reduced-motion: reduce)" ? !!reduceMatches : false,
      media: query,
      addEventListener: (evt, cb) => {
        if (evt === "change" && query === "(prefers-reduced-motion: reduce)") {
          reducedMotionChangeHandlers.push(cb);
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

  function makeFrame(className) {
    const f = document.createElement("iframe");
    f.className = className || "hero-embed__frame";
    document.body.appendChild(f);
    f.posts = [];
    jest
      .spyOn(f.contentWindow, "postMessage")
      .mockImplementation((msg) => f.posts.push(msg));
    return f;
  }

  function load() {
    require("../hero-embed");
    // In jsdom readyState is "complete", so the module wires on require; dispatch
    // DOMContentLoaded too so the "loading" branch is covered as well.
    document.dispatchEvent(new Event("DOMContentLoaded"));
  }

  beforeEach(() => {
    document.documentElement.removeAttribute("data-mode");
    document.documentElement.removeAttribute("data-effect-reduced-motion");
    document.body.innerHTML = "";
    setupMatchMedia(false);
    setupMutationObserver();
    jest.resetModules();
  });

  test("wires each hero frame and posts theme + reduced-motion on init", () => {
    const f = makeFrame();
    load();
    expect(f.posts).toContainEqual({ theme: "light", reduce: false });
  });

  test("excludes the lightbox's own embed frame", () => {
    const hero = makeFrame("hero-embed__frame");
    const lb = makeFrame("hero-embed__frame lightbox__embed");
    load();
    expect(hero.posts.length).toBeGreaterThan(0);
    expect(lb.posts.length).toBe(0);
  });

  test("posts dark when the site is in dark mode", () => {
    document.documentElement.setAttribute("data-mode", "dark");
    const f = makeFrame();
    load();
    expect(f.posts.pop()).toEqual({ theme: "dark", reduce: false });
  });

  test("posts reduce:true for the manual reduced-motion toggle", () => {
    document.documentElement.setAttribute("data-effect-reduced-motion", "on");
    const f = makeFrame();
    load();
    expect(f.posts.pop()).toEqual({ theme: "light", reduce: true });
  });

  test("posts reduce:true when the OS prefers reduced motion", () => {
    setupMatchMedia(true);
    const f = makeFrame();
    load();
    expect(f.posts.pop()).toEqual({ theme: "light", reduce: true });
  });

  test("re-posts to every frame when data-mode flips", () => {
    const f = makeFrame();
    load();
    f.posts.length = 0;
    document.documentElement.setAttribute("data-mode", "dark");
    mutationCallback([{ attributeName: "data-mode" }]);
    expect(f.posts.pop()).toEqual({ theme: "dark", reduce: false });
  });

  test("re-posts when the reduced-motion toggle flips", () => {
    const f = makeFrame();
    load();
    f.posts.length = 0;
    document.documentElement.setAttribute("data-effect-reduced-motion", "on");
    mutationCallback([{ attributeName: "data-effect-reduced-motion" }]);
    expect(f.posts.pop()).toEqual({ theme: "light", reduce: true });
  });

  test("re-posts when the OS reduced-motion preference changes", () => {
    const f = makeFrame();
    load();
    f.posts.length = 0;
    expect(reducedMotionChangeHandlers.length).toBeGreaterThan(0);
    reducedMotionChangeHandlers.forEach((cb) => cb());
    expect(f.posts.length).toBeGreaterThan(0);
  });

  test("a frame's load event re-posts the current theme", () => {
    const f = makeFrame();
    load();
    f.posts.length = 0;
    f.dispatchEvent(new Event("load"));
    expect(f.posts).toContainEqual({ theme: "light", reduce: false });
  });

  test("refresh wires newly swapped-in frames without re-wiring existing ones", () => {
    const f1 = makeFrame();
    load();
    const before = f1.posts.length;
    const f2 = makeFrame();
    window.HeroEmbed.refresh();
    // the new frame gets wired + posted; the existing one is not re-posted
    expect(f2.posts.length).toBeGreaterThan(0);
    expect(f1.posts.length).toBe(before);
    expect(f1.dataset.heroWired).toBe("1");
  });
});
