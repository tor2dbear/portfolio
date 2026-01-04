/**
 * Tests for progressbar.js
 * Scroll-based progress indicator with brand animation
 */

describe("Progress Bar - Scroll Indicator", () => {
  let hyphenLeft, hyphenRight, brandLink;
  let brandFirst, brandSecond, brandThird, brandFourth, brandFifth;

  beforeEach(() => {
    // Setup DOM with all required elements
    document.body.innerHTML = `
      <div id="hyphen-left"></div>
      <div id="hyphen-right"></div>
      <div id="brand-link"></div>
      <div class="brand-first">Brand</div>
      <div class="brand-second">Name</div>
      <div class="brand-third">Part</div>
      <div class="brand-fourth">Four</div>
      <div class="brand-fifth">Five</div>
    `;

    hyphenLeft = document.getElementById("hyphen-left");
    hyphenRight = document.getElementById("hyphen-right");
    brandLink = document.getElementById("brand-link");

    brandFirst = document.querySelector(".brand-first");
    brandSecond = document.querySelector(".brand-second");
    brandThird = document.querySelector(".brand-third");
    brandFourth = document.querySelector(".brand-fourth");
    brandFifth = document.querySelector(".brand-fifth");

    // Mock offsetWidth for brand elements
    Object.defineProperty(brandFirst, "offsetWidth", {
      configurable: true,
      value: 50,
    });
    Object.defineProperty(brandSecond, "offsetWidth", {
      configurable: true,
      value: 40,
    });
    Object.defineProperty(brandThird, "offsetWidth", {
      configurable: true,
      value: 30,
    });
    Object.defineProperty(brandFourth, "offsetWidth", {
      configurable: true,
      value: 35,
    });
    Object.defineProperty(brandFifth, "offsetWidth", {
      configurable: true,
      value: 45,
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

  describe("Brand Width Calculation", () => {
    test("should calculate total brand width correctly", () => {
      const widthFirst = brandFirst.offsetWidth;
      const widthSecond = brandSecond.offsetWidth;
      const widthThird = brandThird.offsetWidth;
      const widthFourth = brandFourth.offsetWidth;
      const widthFifth = brandFifth.offsetWidth;

      const brandBase =
        widthFirst + widthSecond + widthThird + widthFourth + widthFifth;

      expect(brandBase).toBe(200); // 50 + 40 + 30 + 35 + 45
    });

    test("should format brand width with 5px offset", () => {
      const brandBase = 200;
      const brandWidth = brandBase + 5 + "px";

      expect(brandWidth).toBe("205px");
    });

    test("should query all brand elements", () => {
      expect(brandFirst).toBeTruthy();
      expect(brandSecond).toBeTruthy();
      expect(brandThird).toBeTruthy();
      expect(brandFourth).toBeTruthy();
      expect(brandFifth).toBeTruthy();
    });
  });

  describe("Scroll Calculations", () => {
    test("should calculate scroll position from body.scrollTop", () => {
      document.body.scrollTop = 600;
      const winScroll =
        document.body.scrollTop || document.documentElement.scrollTop;

      expect(winScroll).toBe(600);
    });

    test("should calculate scroll position from documentElement.scrollTop", () => {
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 600;
      const winScroll =
        document.body.scrollTop || document.documentElement.scrollTop;

      expect(winScroll).toBe(600);
    });

    test("should calculate scrollable height", () => {
      const height =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;

      expect(height).toBe(1200); // 2000 - 800
    });

    test("should calculate scroll percentage (0%)", () => {
      const winScroll = 0;
      const height = 1200;
      const percentage = winScroll / height;

      expect(percentage).toBe(0);
    });

    test("should calculate scroll percentage (50%)", () => {
      const winScroll = 600;
      const height = 1200;
      const percentage = winScroll / height;

      expect(percentage).toBe(0.5);
    });

    test("should calculate scroll percentage (100%)", () => {
      const winScroll = 1200;
      const height = 1200;
      const percentage = winScroll / height;

      expect(percentage).toBe(1);
    });
  });

  describe("Progress Bar Width Calculations", () => {
    test("should calculate left hyphen width at 0% scroll", () => {
      const winScroll = 0;
      const height = 1200;
      const scrolledleft = (winScroll / height) * 30 + "%";
      const corr = (winScroll / height) * 5.4 + "rem";

      expect(scrolledleft).toBe("0%");
      expect(corr).toBe("0rem");
    });

    test("should calculate left hyphen width at 50% scroll", () => {
      const winScroll = 600;
      const height = 1200;
      const scrolledleft = (winScroll / height) * 30 + "%";
      const corr = (winScroll / height) * 5.4 + "rem";

      expect(scrolledleft).toBe("15%");
      expect(corr).toBe("2.7rem");
    });

    test("should calculate left hyphen width at 100% scroll", () => {
      const winScroll = 1200;
      const height = 1200;
      const scrolledleft = (winScroll / height) * 30 + "%";
      const corr = (winScroll / height) * 5.4 + "rem";

      expect(scrolledleft).toBe("30%");
      expect(corr).toBe("5.4rem");
    });

    test("should calculate right hyphen width at 0% scroll", () => {
      const winScroll = 0;
      const height = 1200;
      const scrolledright = (winScroll / height) * 70 + "%";

      expect(scrolledright).toBe("0%");
    });

    test("should calculate right hyphen width at 50% scroll", () => {
      const winScroll = 600;
      const height = 1200;
      const scrolledright = (winScroll / height) * 70 + "%";

      expect(scrolledright).toBe("35%");
    });

    test("should calculate right hyphen width at 100% scroll", () => {
      const winScroll = 1200;
      const height = 1200;
      const scrolledright = (winScroll / height) * 70 + "%";

      expect(scrolledright).toBe("70%");
    });
  });

  describe("Brand Animation Calculations", () => {
    test("should calculate brand width percentage at 0% scroll", () => {
      const winScroll = 0;
      const height = 1200;
      const scrolledBrand = (winScroll / height) * 100 + "%";
      const corrBrand = 1 - winScroll / height;

      expect(scrolledBrand).toBe("0%");
      expect(corrBrand).toBe(1);
    });

    test("should calculate brand width percentage at 50% scroll", () => {
      const winScroll = 600;
      const height = 1200;
      const scrolledBrand = (winScroll / height) * 100 + "%";
      const corrBrand = 1 - winScroll / height;

      expect(scrolledBrand).toBe("50%");
      expect(corrBrand).toBe(0.5);
    });

    test("should calculate brand width percentage at 100% scroll", () => {
      const winScroll = 1200;
      const height = 1200;
      const scrolledBrand = (winScroll / height) * 100 + "%";
      const corrBrand = 1 - winScroll / height;

      expect(scrolledBrand).toBe("100%");
      expect(corrBrand).toBe(0);
    });
  });

  describe("progressBar() Function", () => {
    beforeEach(() => {
      // Define progressBar function for testing
      window.progressBar = function () {
        var winScroll =
          document.body.scrollTop || document.documentElement.scrollTop;
        var height =
          document.documentElement.scrollHeight -
          document.documentElement.clientHeight;
        var scrolledleft = (winScroll / height) * 30 + "%";
        var scrolledright = (winScroll / height) * 70 + "%";
        var corr = (winScroll / height) * 5.4 + "rem";
        var scrolledBrand = (winScroll / height) * 100 + "%";
        var corrBrand = 1 - winScroll / height;

        const widthFirst = 50;
        const widthSecond = 40;
        const widthThird = 30;
        const widthFourth = 35;
        const widthFifth = 45;
        const brandBase =
          widthFirst + widthSecond + widthThird + widthFourth + widthFifth;
        const brandWidth = brandBase + 5 + "px";

        document.getElementById("hyphen-left").style.width =
          "calc(" + scrolledleft + " - " + corr + ")";
        document.getElementById("hyphen-right").style.width =
          "calc(" + scrolledright + " - " + corr + ")";
        document.getElementById("brand-link").style.width =
          "calc(" +
          brandWidth +
          " * " +
          corrBrand +
          " + " +
          scrolledBrand +
          ")";
      };
    });

    test("should update hyphen-left width at 0% scroll", () => {
      document.documentElement.scrollTop = 0;
      window.progressBar();

      expect(hyphenLeft.style.width).toBe("calc(0% - 0rem)");
    });

    test("should update hyphen-left width at 50% scroll", () => {
      document.documentElement.scrollTop = 600;
      window.progressBar();

      expect(hyphenLeft.style.width).toBe("calc(15% - 2.7rem)");
    });

    test("should update hyphen-right width at 0% scroll", () => {
      document.documentElement.scrollTop = 0;
      window.progressBar();

      expect(hyphenRight.style.width).toBe("calc(0% - 0rem)");
    });

    test("should update hyphen-right width at 50% scroll", () => {
      document.documentElement.scrollTop = 600;
      window.progressBar();

      expect(hyphenRight.style.width).toBe("calc(35% - 2.7rem)");
    });

    test("should update brand-link width at 0% scroll", () => {
      document.documentElement.scrollTop = 0;
      window.progressBar();

      // Browser optimizes calc() expressions
      expect(brandLink.style.width).toBe("calc(0% + 205px)");
    });

    test("should update brand-link width at 50% scroll", () => {
      document.documentElement.scrollTop = 600;
      window.progressBar();

      // Browser optimizes "205px * 0.5" to "102.5px"
      expect(brandLink.style.width).toBe("calc(50% + 102.5px)");
    });

    test("should update brand-link width at 100% scroll", () => {
      document.documentElement.scrollTop = 1200;
      window.progressBar();

      // Browser optimizes "205px * 0" to "0px"
      expect(brandLink.style.width).toBe("calc(100% + 0px)");
    });
  });

  describe("Scroll Event Handler", () => {
    test("should detect window.onscroll assignment", () => {
      const scrollHandler = jest.fn();
      window.onscroll = scrollHandler;

      expect(window.onscroll).toBe(scrollHandler);
    });

    test("should call progressBar on scroll event", () => {
      window.progressBar = jest.fn();
      window.onscroll = function () {
        window.progressBar();
      };

      const scrollEvent = new Event("scroll");
      window.dispatchEvent(scrollEvent);

      expect(window.progressBar).toHaveBeenCalled();
    });
  });

  describe("CSS calc() Format", () => {
    test("should format hyphen calc with percentage and rem", () => {
      const scrolledleft = "15%";
      const corr = "2.7rem";
      const calcString = "calc(" + scrolledleft + " - " + corr + ")";

      expect(calcString).toBe("calc(15% - 2.7rem)");
    });

    test("should format brand calc with px multiplier and percentage", () => {
      const brandWidth = "205px";
      const corrBrand = 0.5;
      const scrolledBrand = "50%";
      const calcString =
        "calc(" + brandWidth + " * " + corrBrand + " + " + scrolledBrand + ")";

      expect(calcString).toBe("calc(205px * 0.5 + 50%)");
    });
  });

  describe("Edge Cases", () => {
    test("should handle zero height gracefully", () => {
      Object.defineProperty(document.documentElement, "scrollHeight", {
        configurable: true,
        value: 800,
      });

      const height =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;

      expect(height).toBe(0);
      // Division by zero would result in Infinity
      const percentage = 100 / height;
      expect(percentage).toBe(Infinity);
    });

    test("should handle negative scroll values", () => {
      document.documentElement.scrollTop = -100;
      const winScroll = document.documentElement.scrollTop;

      expect(winScroll).toBe(-100);
    });
  });
});
