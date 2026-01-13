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

  test("stagger-reveals elements already in view on load", () => {
    const elements = document.querySelectorAll(".reveal");
    elements.forEach((element) => {
      element.getBoundingClientRect = jest.fn(() => ({
        top: 10,
        bottom: 110,
        height: 100,
      }));
    });

    window.innerHeight = 800;
    globalThis.IntersectionObserver = jest.fn(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));

    require("../reveal-on-scroll");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    expect(elements[0].classList.contains("is-revealed")).toBe(true);
    expect(elements[1].classList.contains("is-revealed")).toBe(true);
    expect(elements[0].style.getPropertyValue("--reveal-delay")).toBe("0ms");
    expect(elements[1].style.getPropertyValue("--reveal-delay")).toBe("80ms");
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

  test("stagger-reveals post-content children independently", () => {
    document.body.innerHTML = `
      <h1 class="reveal">Title</h1>
      <div class="post-content">
        <p>Alpha</p>
        <p>Beta</p>
      </div>
    `;

    document.querySelectorAll(".reveal, .post-content > *").forEach((element) => {
      element.getBoundingClientRect = jest.fn(() => ({
        top: 10,
        bottom: 110,
        height: 100,
      }));
    });

    window.innerHeight = 800;
    globalThis.IntersectionObserver = jest.fn(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));

    require("../reveal-on-scroll");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    const postChildren = document.querySelectorAll(".post-content > *");
    expect(postChildren[0].style.getPropertyValue("--reveal-delay")).toBe("0ms");
    expect(postChildren[1].style.getPropertyValue("--reveal-delay")).toBe("60ms");
  });
});
