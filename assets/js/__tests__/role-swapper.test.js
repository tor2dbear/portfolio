/**
 * Tests for role-swapper.js
 * Rotating hero role text with reduced-motion support
 */

describe("Role Swapper - Hero Text", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.resetModules();
  });

  test("cycles through roles on an interval", () => {
    document.body.innerHTML = `
      <span
        data-js="role-swapper"
        data-roles='["One","Two"]'
        data-interval="1000"
        data-fade="100"
        data-suffix="."
      ><span data-js="role-swapper-text">One.</span></span>
    `;

    jest.useFakeTimers();
    require("../role-swapper");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    expect(
      document.querySelector('[data-js="role-swapper-text"]').textContent
    ).toBe("One.");

    jest.advanceTimersByTime(1100);

    expect(
      document.querySelector('[data-js="role-swapper-text"]').textContent
    ).toBe("Two.");
  });

  test("does not animate when reduced motion is enabled", () => {
    document.body.innerHTML = `
      <span
        data-js="role-swapper"
        data-roles='["One","Two"]'
        data-interval="1000"
        data-fade="100"
        data-suffix="."
      ><span data-js="role-swapper-text">One.</span></span>
    `;

    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    jest.useFakeTimers();
    require("../role-swapper");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    jest.advanceTimersByTime(2000);

    expect(
      document.querySelector('[data-js="role-swapper-text"]').textContent
    ).toBe("One.");
  });
});
