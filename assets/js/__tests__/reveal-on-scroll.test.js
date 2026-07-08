/**
 * Tests for reveal-on-scroll.js
 */

describe("Reveal On Scroll", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="reveal">One</div>
      <div class="reveal">Two</div>
    `;

    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    window.requestAnimationFrame = (callback) => callback();

    document.querySelectorAll(".reveal").forEach((element) => {
      element.getBoundingClientRect = jest.fn(() => ({
        top: 2000,
        bottom: 2100,
        height: 100,
      }));
    });

    jest.resetModules();
  });

  test("reveals elements immediately when reduced motion is enabled", () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    globalThis.IntersectionObserver = jest.fn();

    require("../reveal-on-scroll");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    const elements = document.querySelectorAll(".reveal");
    elements.forEach((element) => {
      expect(element.classList.contains("is-revealed")).toBe(true);
    });
    expect(globalThis.IntersectionObserver).not.toHaveBeenCalled();
  });

  test("reveals elements when they intersect and unobserves them", () => {
    let observerCallback;
    let observerInstance;

    globalThis.IntersectionObserver = jest.fn((callback) => {
      observerCallback = callback;
      observerInstance = {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
      return observerInstance;
    });

    require("../reveal-on-scroll");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    const elements = document.querySelectorAll(".reveal");
    expect(observerInstance.observe).toHaveBeenCalledTimes(elements.length);

    observerCallback(
      [{ isIntersecting: true, target: elements[0] }],
      observerInstance
    );

    expect(elements[0].classList.contains("is-revealed")).toBe(true);
    expect(observerInstance.unobserve).toHaveBeenCalledWith(elements[0]);
  });

  test("applies a left→right stagger from position when revealed", () => {
    const elements = document.querySelectorAll(".reveal");
    elements[0].getBoundingClientRect = jest.fn(() => ({
      top: 10,
      bottom: 110,
      height: 100,
      left: 0,
    }));
    elements[1].getBoundingClientRect = jest.fn(() => ({
      top: 10,
      bottom: 110,
      height: 100,
      left: 400,
    }));

    window.innerWidth = 800;
    let observerCallback;
    let observerInstance;
    globalThis.IntersectionObserver = jest.fn((callback) => {
      observerCallback = callback;
      observerInstance = {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
      return observerInstance;
    });

    require("../reveal-on-scroll");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    observerCallback(
      [
        { isIntersecting: true, target: elements[0] },
        { isIntersecting: true, target: elements[1] },
      ],
      observerInstance
    );

    expect(elements[0].classList.contains("is-revealed")).toBe(true);
    expect(elements[1].classList.contains("is-revealed")).toBe(true);
    // left 0 → 0ms; left 400 of 800px viewport → 0.5 * 160ms = 80ms
    expect(elements[0].style.getPropertyValue("--reveal-delay")).toBe("0ms");
    expect(elements[1].style.getPropertyValue("--reveal-delay")).toBe("80ms");
  });

  test("fast-paths reveal--immediate elements without observing them", () => {
    document.body.innerHTML = `
      <h1 class="reveal reveal--immediate">Hero</h1>
      <div class="reveal">Other</div>
    `;
    document.querySelectorAll(".reveal").forEach((element) => {
      element.getBoundingClientRect = jest.fn(() => ({
        top: 10,
        bottom: 110,
        height: 100,
        left: 0,
      }));
    });

    let observerInstance;
    globalThis.IntersectionObserver = jest.fn(() => {
      observerInstance = {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
      return observerInstance;
    });

    require("../reveal-on-scroll");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    const hero = document.querySelector(".reveal--immediate");
    // Revealed immediately, and never handed to the observer.
    expect(hero.classList.contains("is-revealed")).toBe(true);
    expect(observerInstance.observe).toHaveBeenCalledTimes(1);
  });

  test("adds reveal class to post-content children", () => {
    document.body.innerHTML = `
      <div class="post-content">
        <p>Alpha</p>
        <figure></figure>
      </div>
    `;

    document.querySelectorAll(".post-content > *").forEach((element) => {
      element.getBoundingClientRect = jest.fn(() => ({
        top: 2000,
        bottom: 2100,
        height: 100,
      }));
    });

    globalThis.IntersectionObserver = jest.fn(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));

    require("../reveal-on-scroll");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    const children = document.querySelectorAll(".post-content > *");
    children.forEach((child) => {
      expect(child.classList.contains("reveal")).toBe(true);
    });
    expect(document.querySelector(".post-content").classList.contains("reveal")).toBe(false);
  });

  test("promoted post-content children are observed and revealed on intersect", () => {
    document.body.innerHTML = `
      <div class="post-content">
        <p>Alpha</p>
        <p>Beta</p>
      </div>
    `;

    document.querySelectorAll(".post-content > *").forEach((element) => {
      element.getBoundingClientRect = jest.fn(() => ({
        top: 2000,
        bottom: 2100,
        height: 100,
        left: 0,
      }));
    });

    let observerCallback;
    let observerInstance;
    globalThis.IntersectionObserver = jest.fn((callback) => {
      observerCallback = callback;
      observerInstance = {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
      return observerInstance;
    });

    require("../reveal-on-scroll");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    const postChildren = document.querySelectorAll(".post-content > *");
    // Both promoted to .reveal and observed (no DOM-order pre-stagger).
    expect(observerInstance.observe).toHaveBeenCalledTimes(postChildren.length);

    observerCallback(
      [{ isIntersecting: true, target: postChildren[0] }],
      observerInstance
    );
    expect(postChildren[0].classList.contains("is-revealed")).toBe(true);
    expect(observerInstance.unobserve).toHaveBeenCalledWith(postChildren[0]);
  });
});
