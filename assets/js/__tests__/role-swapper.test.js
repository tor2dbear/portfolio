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
        data-interval="1000"
        data-fade="100"
      >
        <span class="role-swapper__item is-active" data-role="One" aria-hidden="false">One.</span>
        <span class="role-swapper__item" data-role="Two" aria-hidden="true">Two.</span>
      </span>
    `;

    jest.useFakeTimers();
    require("../role-swapper");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    expect(
      document.querySelector(".role-swapper__item.is-active").textContent
    ).toBe("One.");

    jest.advanceTimersByTime(1100);

    expect(
      document.querySelector(".role-swapper__item.is-active").textContent
    ).toBe("Two.");
  });

  test("starts from a random role when configured", () => {
    document.body.innerHTML = `
      <span
        data-js="role-swapper"
        data-start="random"
        data-interval="1000"
        data-fade="100"
      >
        <span class="role-swapper__item is-active" data-role="One" aria-hidden="false">One.</span>
        <span class="role-swapper__item" data-role="Two" aria-hidden="true">Two.</span>
        <span class="role-swapper__item" data-role="Three" aria-hidden="true">Three.</span>
      </span>
    `;

    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0.6);
    require("../role-swapper");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    expect(
      document.querySelector(".role-swapper__item.is-active").textContent
    ).toBe("Two.");

    Math.random.mockRestore();
  });

  test("does not animate when reduced motion is enabled", () => {
    document.body.innerHTML = `
      <span
        data-js="role-swapper"
        data-interval="1000"
        data-fade="100"
      >
        <span class="role-swapper__item is-active" data-role="One" aria-hidden="false">One.</span>
        <span class="role-swapper__item" data-role="Two" aria-hidden="true">Two.</span>
      </span>
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
      document.querySelector(".role-swapper__item.is-active").textContent
    ).toBe("One.");
  });
});
