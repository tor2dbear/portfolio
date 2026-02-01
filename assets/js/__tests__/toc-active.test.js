/**
 * Tests for toc-active.js
 */

describe("ToC Active", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <ul class="toc">
        <li class="toc__item"><a data-toc-link="letter" href="#letter">Letter</a></li>
        <li class="toc__item"><a data-toc-link="portfolio" href="#portfolio">Portfolio</a></li>
      </ul>
      <a id="letter" data-toc-section="letter"></a>
      <a id="portfolio" data-toc-section="portfolio"></a>
    `;

    delete window.location;
    window.location = new URL("https://example.com/");

    jest.resetModules();
  });

  test("sets active link from hash on load", () => {
    window.location.hash = "#portfolio";

    globalThis.IntersectionObserver = jest.fn();

    require("../toc-active");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    const activeLink = document.querySelector('[data-toc-link="portfolio"]');
    expect(activeLink.classList.contains("is-active")).toBe(true);
    expect(activeLink.getAttribute("aria-current")).toBe("true");
  });

  test("updates active link when section intersects", () => {
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

    require("../toc-active");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    const portfolioSection = document.querySelector(
      '[data-toc-section="portfolio"]'
    );
    observerCallback([{ isIntersecting: true, target: portfolioSection }]);

    const activeLink = document.querySelector('[data-toc-link="portfolio"]');
    expect(activeLink.classList.contains("is-active")).toBe(true);
  });
});
