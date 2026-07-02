/**
 * Tests for role-swapper.js
 * Typewriter hero role text with reduced-motion support.
 */

describe("Role Swapper - Hero Text", () => {
  const markup = (attrs = "") => `
    <span
      data-js="role-swapper"
      data-roles='["One","Two","Three"]'
      data-suffix="."
      data-interval="1000"
      ${attrs}
    ><span data-js="role-swapper-text">One.</span></span>
  `;

  const textEl = () => document.querySelector('[data-js="role-swapper-text"]');

  afterEach(() => {
    jest.useRealTimers();
    jest.resetModules();
  });

  test("types the next role in after deleting the current one", () => {
    document.body.innerHTML = markup();
    jest.useFakeTimers();
    require("../role-swapper");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // Starts on the first role, fully typed.
    expect(textEl().textContent).toBe("One.");

    // Hold (1000) + delete "One." (4 * 40) + type "Two." (4 * 70) = 1440ms.
    jest.advanceTimersByTime(1600);
    expect(textEl().textContent).toBe("Two.");
  });

  test("passes through an empty string between roles", () => {
    document.body.innerHTML = markup();
    jest.useFakeTimers();
    require("../role-swapper");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // Hold 1000 + 4 deletes (160) lands on the empty string.
    jest.advanceTimersByTime(1160);
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

  test("does not animate when reduced motion is enabled", () => {
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
});
