/**
 * Tests for role-swapper.js
 * Typewriter hero role text with reduced-motion support (OS + site toggle).
 */

describe("Role Swapper - Hero Text", () => {
  // Explicit speeds so timing is deterministic regardless of the defaults.
  const markup = (attrs = "") => `
    <span
      data-js="role-swapper"
      data-roles='["One","Two","Three"]'
      data-suffix="."
      data-interval="1000"
      data-type-speed="100"
      data-delete-speed="50"
      data-blink="200"
      ${attrs}
    ><span data-js="role-swapper-text">One.</span></span>
  `;

  const textEl = () => document.querySelector('[data-js="role-swapper-text"]');

  afterEach(() => {
    jest.useRealTimers();
    jest.resetModules();
    document.documentElement.removeAttribute("data-effect-reduced-motion");
    delete window.matchMedia;
  });

  test("types the next role in after deleting the current one", () => {
    document.body.innerHTML = markup();
    jest.useFakeTimers();
    require("../role-swapper");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    expect(textEl().textContent).toBe("One.");

    // hold 1000 + delete "One." (4*50) + type "Two." (4*100) + a switch step.
    jest.advanceTimersByTime(1800);
    expect(textEl().textContent).toBe("Two.");
  });

  test("passes through an empty string between roles", () => {
    document.body.innerHTML = markup();
    jest.useFakeTimers();
    require("../role-swapper");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // hold 1000 + 4 deletes (200) lands on the empty string.
    jest.advanceTimersByTime(1180);
    expect(textEl().textContent).toBe("");
  });

  test("starts from a random role when configured", () => {
    document.body.innerHTML = markup('data-start="random"');
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0.6); // floor(0.6 * 3) = 1

    require("../role-swapper");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    expect(textEl().textContent).toBe("Two.");
    Math.random.mockRestore();
  });

  test("does not animate when OS reduced motion is enabled", () => {
    document.body.innerHTML = markup();
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    jest.useFakeTimers();
    require("../role-swapper");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    jest.advanceTimersByTime(5000);
    expect(textEl().textContent).toBe("One.");
  });

  test("does not animate when the site reduce-motion toggle is on", () => {
    document.documentElement.setAttribute("data-effect-reduced-motion", "on");
    document.body.innerHTML = markup();

    jest.useFakeTimers();
    require("../role-swapper");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    jest.advanceTimersByTime(5000);
    expect(textEl().textContent).toBe("One.");
  });
});
