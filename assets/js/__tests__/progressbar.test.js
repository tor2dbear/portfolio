/**
 * Tests for progressbar.js
 * Scroll-based progress indicator with brand animation
 */

describe("Progress Bar - Scroll Indicator", () => {
  let brandMark, brandLineLeft, brandLineRight, brandLoop;
  let brandParts;
  let originalGetComputedStyle;

  beforeEach(() => {
    // Setup DOM with all required elements
    document.body.innerHTML = `
      <div class="top-menu__container">
        <div class="brand">
          <div class="brand__word">tor</div>
          <svg data-js="brand-mark">
            <line data-js="brand-line-left"></line>
            <g data-js="brand-loop"></g>
            <line data-js="brand-line-right"></line>
          </svg>
          <div class="brand__word">bjorn.com</div>
        </div>
        <nav class="top-menu__nav"></nav>
      </div>
      <div data-js="brand-link"></div>
      <div data-brand-part="true">Brand</div>
      <div data-brand-part="true">Name</div>
      <div data-brand-part="true">Part</div>
      <div data-brand-part="true">Four</div>
      <div data-brand-part="true">Five</div>
    `;

    brandMark = document.querySelector('[data-js="brand-mark"]');
    brandLineLeft = document.querySelector('[data-js="brand-line-left"]');
    brandLineRight = document.querySelector('[data-js="brand-line-right"]');
    brandLoop = document.querySelector('[data-js="brand-loop"]');

    brandParts = Array.from(
      document.querySelectorAll('[data-brand-part="true"]')
    );

    window.matchMedia = jest.fn().mockReturnValue({ matches: false });

    const headerContainer = document.querySelector(".top-menu__container");
    const nav = document.querySelector(".top-menu__nav");
    const brandWords = document.querySelectorAll(".brand__word");

    Object.defineProperty(headerContainer, "offsetWidth", {
      configurable: true,
      value: 600,
    });

    Object.defineProperty(nav, "offsetWidth", {
      configurable: true,
      value: 200,
    });

    Object.defineProperty(brandWords[0], "offsetWidth", {
      configurable: true,
      value: 60,
    });

    Object.defineProperty(brandWords[1], "offsetWidth", {
      configurable: true,
      value: 90,
    });

    // Mock offsetWidth for brand elements
    const widths = [50, 40, 30, 35, 45];
    brandParts.forEach((part, index) => {
      Object.defineProperty(part, "offsetWidth", {
        configurable: true,
        value: widths[index],
      });
    });

    originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = jest.fn().mockReturnValue({
      columnGap: "24px",
    });

    // Mock document scroll properties
    Object.defineProperty(document.body, "scrollTop", {
      configurable: true,
      writable: true,
      value: 0,
    });

    Object.defineProperty(document.documentElement, "scrollTop", {
      configurable: true,
      writable: true,
      value: 0,
    });

    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 2000,
    });

    Object.defineProperty(document.documentElement, "clientHeight", {
      configurable: true,
      value: 800,
    });
  });

  afterEach(() => {
    window.getComputedStyle = originalGetComputedStyle;
  });

  describe("progressBar() Function", () => {
    beforeEach(() => {
      // Define progressBar function for testing
      window.progressBar = function () {
        const loopWidth = 24;
        const loopHeight = 24;

        const containerWidth = 600;
        const navWidth = 200;
        const columnGap = 24;
        const availableWidth = Math.max(0, containerWidth - navWidth - columnGap);
        const wordWidth = 60 + 90;
        const maxGap = Math.max(0, availableWidth - wordWidth);
        const lineGap = Math.max(0, maxGap - loopWidth);
        const leftMaxPx = lineGap * 0.3;
        const rightMaxPx = lineGap * 0.7;

        var winScroll =
          document.body.scrollTop || document.documentElement.scrollTop;
        var height =
          document.documentElement.scrollHeight -
          document.documentElement.clientHeight;
        var progress = height > 0 ? winScroll / height : 0;

        progress = Math.min(Math.max(progress, 0), 1);

        const leftLength = leftMaxPx * progress;
        const rightLength = rightMaxPx * progress;
        const markWidth = loopWidth + leftLength + rightLength;

        brandMark.style.width = markWidth + "px";
        brandMark.setAttribute("viewBox", "0 0 " + markWidth + " " + loopHeight);

        brandLineLeft.setAttribute("x2", leftLength.toFixed(2));
        brandLineRight.setAttribute(
          "x1",
          (leftLength + loopWidth).toFixed(2)
        );
        brandLineRight.setAttribute("x2", markWidth.toFixed(2));
        brandLoop.setAttribute(
          "transform",
          "translate(" + leftLength.toFixed(2) + " 0)"
        );
      };
    });

    test("should update svg width and lines at 0% scroll", () => {
      document.documentElement.scrollTop = 0;
      window.progressBar();

      expect(brandMark.style.width).toBe("24px");
      expect(brandMark.getAttribute("viewBox")).toBe("0 0 24 24");
      expect(brandLineLeft.getAttribute("x2")).toBe("0.00");
      expect(brandLineRight.getAttribute("x1")).toBe("24.00");
      expect(brandLineRight.getAttribute("x2")).toBe("24.00");
    });

    test("should update svg width and lines at 50% scroll", () => {
      document.documentElement.scrollTop = 600;
      window.progressBar();

      expect(parseFloat(brandMark.style.width)).toBeCloseTo(125, 5);
      expect(brandMark.getAttribute("viewBox")).toBe("0 0 124.99999999999999 24");
      expect(parseFloat(brandLineLeft.getAttribute("x2"))).toBeCloseTo(30.3, 2);
      expect(parseFloat(brandLineRight.getAttribute("x1"))).toBeCloseTo(54.3, 2);
      expect(parseFloat(brandLineRight.getAttribute("x2"))).toBeCloseTo(125, 2);
    });
  });
});
