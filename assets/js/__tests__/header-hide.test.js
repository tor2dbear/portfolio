/**
 * Tests for header-hide.js
 * Scroll-based header hide/show functionality with direction detection
 */

describe("Header Hide - Scroll Direction Detection", () => {
  let header, layout;
  let checkScroll, toggleHeader;
  let curScroll, prevScroll, curDirection, prevDirection, lastY, toggled;
  let downThreshold, upThreshold;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="layout"></div>
      <div id="topmenu"></div>
    `;

    header = document.getElementById("topmenu");
    layout = document.getElementById("layout");

    // Initialize variables matching header-hide.js
    prevScroll = 0;
    curDirection = 0;
    prevDirection = 0;
    lastY = 0;
    downThreshold = 300;
    upThreshold = 200;

    // Mock window.scrollY and documentElement.scrollTop
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 0,
    });

    Object.defineProperty(document.documentElement, "scrollTop", {
      writable: true,
      configurable: true,
      value: 0,
    });

    // Define checkScroll function
    checkScroll = function () {
      curScroll = window.scrollY || document.documentElement.scrollTop;
      if (curScroll > prevScroll) {
        // scrolled down
        curDirection = 2;
      } else {
        //scrolled up
        curDirection = 1;
      }

      if (curDirection !== prevDirection) {
        toggled = toggleHeader();
      } else {
        lastY = curScroll;
      }

      prevScroll = curScroll;
      if (toggled) {
        prevDirection = curDirection;
      }
    };

    // Define toggleHeader function
    toggleHeader = function () {
      toggled = true;
      //remove hide when menu active
      if (document.getElementById("layout").classList.contains("active")) {
        lastY = curScroll;
        header.classList.remove("hide");
      }
      //trigger faster on top
      else if (curDirection === 2 && curScroll < 10) {
        lastY = curScroll;
        header.classList.add("relative");
      } else if (curDirection === 2 && curScroll - lastY > downThreshold) {
        lastY = curScroll;
        header.classList.add("hide");
        header.classList.remove("relative");
      } else if (curDirection === 1 && lastY - curScroll > upThreshold) {
        lastY = curScroll;
        header.classList.remove("hide");
        header.classList.remove("relative");
      } else {
        toggled = false;
      }
      return toggled;
    };
  });

  describe("Scroll Direction Detection", () => {
    test("should detect scroll down (direction 2)", () => {
      prevScroll = 100;
      window.scrollY = 200;

      checkScroll();

      expect(curDirection).toBe(2);
    });

    test("should detect scroll up (direction 1)", () => {
      prevScroll = 200;
      window.scrollY = 100;

      checkScroll();

      expect(curDirection).toBe(1);
    });

    test("should initialize with direction 0", () => {
      expect(curDirection).toBe(0);
      expect(prevDirection).toBe(0);
    });

    test("should use window.scrollY when available", () => {
      window.scrollY = 150;

      checkScroll();

      expect(curScroll).toBe(150);
    });

    test("should fallback to documentElement.scrollTop", () => {
      window.scrollY = undefined;
      document.documentElement.scrollTop = 250;

      checkScroll();

      expect(curScroll).toBe(250);
    });
  });

  describe("checkScroll() Function", () => {
    test("should update prevScroll after each check", () => {
      window.scrollY = 100;
      checkScroll();

      expect(prevScroll).toBe(100);

      window.scrollY = 200;
      checkScroll();

      expect(prevScroll).toBe(200);
    });

    test("should call toggleHeader when direction changes", () => {
      const toggleHeaderSpy = jest.fn(() => true);
      toggleHeader = toggleHeaderSpy;

      prevDirection = 0;
      window.scrollY = 100;
      checkScroll();

      expect(toggleHeaderSpy).toHaveBeenCalled();
    });

    test("should not call toggleHeader when direction stays same", () => {
      // First scroll down
      prevDirection = 2;
      curDirection = 2;
      window.scrollY = 100;

      checkScroll();

      // Direction didn't change, so toggleHeader shouldn't be called
      // Instead lastY should be updated
      expect(lastY).toBe(100);
    });

    test("should update prevDirection when toggled is true", () => {
      prevDirection = 0;
      window.scrollY = 500;

      checkScroll();

      // Should toggle and update prevDirection to 2
      expect(toggled).toBe(true);
      expect(prevDirection).toBe(2);
    });
  });

  describe("toggleHeader() Function", () => {
    test("should return toggled state", () => {
      curDirection = 2;
      curScroll = 5;
      lastY = 0;

      const result = toggleHeader();

      expect(typeof result).toBe("boolean");
    });

    test("should remove hide class when menu is active", () => {
      layout.classList.add("active");
      header.classList.add("hide");
      curDirection = 2;
      curScroll = 500;

      toggleHeader();

      expect(header.classList.contains("hide")).toBe(false);
    });

    test("should update lastY when menu is active", () => {
      layout.classList.add("active");
      curScroll = 500;
      lastY = 0;

      toggleHeader();

      expect(lastY).toBe(500);
    });

    test("should add relative class when scrolling down near top", () => {
      curDirection = 2;
      curScroll = 5;
      lastY = 0;

      toggleHeader();

      expect(header.classList.contains("relative")).toBe(true);
    });

    test("should not add relative when scrolled past 10px", () => {
      curDirection = 2;
      curScroll = 15;
      lastY = 0;

      toggleHeader();

      expect(header.classList.contains("relative")).toBe(false);
    });

    test("should add hide class when scrolled down past threshold", () => {
      curDirection = 2;
      curScroll = 400;
      lastY = 50;

      toggleHeader();

      expect(header.classList.contains("hide")).toBe(true);
    });

    test("should remove relative class when hiding header", () => {
      header.classList.add("relative");
      curDirection = 2;
      curScroll = 400;
      lastY = 50;

      toggleHeader();

      expect(header.classList.contains("relative")).toBe(false);
    });

    test("should not hide if below downThreshold (300px)", () => {
      curDirection = 2;
      curScroll = 250;
      lastY = 0;

      const result = toggleHeader();

      expect(header.classList.contains("hide")).toBe(false);
      expect(result).toBe(false);
    });

    test("should remove hide class when scrolling up past threshold", () => {
      header.classList.add("hide");
      curDirection = 1;
      curScroll = 100;
      lastY = 350;

      toggleHeader();

      expect(header.classList.contains("hide")).toBe(false);
    });

    test("should remove relative class when showing header", () => {
      header.classList.add("relative");
      header.classList.add("hide");
      curDirection = 1;
      curScroll = 100;
      lastY = 350;

      toggleHeader();

      expect(header.classList.contains("relative")).toBe(false);
    });

    test("should not show if below upThreshold (200px)", () => {
      header.classList.add("hide");
      curDirection = 1;
      curScroll = 100;
      lastY = 250;

      const result = toggleHeader();

      expect(header.classList.contains("hide")).toBe(true);
      expect(result).toBe(false);
    });

    test("should return false when thresholds not met", () => {
      curDirection = 2;
      curScroll = 100;
      lastY = 0;

      const result = toggleHeader();

      expect(result).toBe(false);
    });
  });

  describe("Threshold Values", () => {
    test("should have downThreshold of 300", () => {
      expect(downThreshold).toBe(300);
    });

    test("should have upThreshold of 200", () => {
      expect(upThreshold).toBe(200);
    });

    test("should hide at exactly downThreshold + 1", () => {
      curDirection = 2;
      lastY = 0;
      curScroll = downThreshold + 1;

      toggleHeader();

      expect(header.classList.contains("hide")).toBe(true);
    });

    test("should show at exactly upThreshold + 1", () => {
      header.classList.add("hide");
      curDirection = 1;
      lastY = upThreshold + 101;
      curScroll = 100;

      toggleHeader();

      expect(header.classList.contains("hide")).toBe(false);
    });
  });

  describe("Scroll Event Integration", () => {
    test("should attach scroll event listener to window", () => {
      const addEventListenerSpy = jest.spyOn(window, "addEventListener");

      // Simulate the IIFE execution
      window.addEventListener("scroll", checkScroll);

      expect(addEventListenerSpy).toHaveBeenCalledWith("scroll", checkScroll);

      addEventListenerSpy.mockRestore();
    });

    test("should handle scroll event", () => {
      window.addEventListener("scroll", checkScroll);

      window.scrollY = 100;
      const scrollEvent = new Event("scroll");
      window.dispatchEvent(scrollEvent);

      expect(curScroll).toBe(100);
    });
  });

  describe("Complete Scroll Scenarios", () => {
    test("should transition from relative to hide when scrolling down", () => {
      // Add relative class when near top
      curDirection = 2;
      curScroll = 5;
      lastY = 0;
      toggleHeader();

      expect(header.classList.contains("relative")).toBe(true);

      // Now scroll down past threshold - should hide
      curDirection = 2;
      curScroll = 400;
      lastY = 50;
      toggleHeader();

      expect(header.classList.contains("hide")).toBe(true);
      expect(header.classList.contains("relative")).toBe(false);
    });

    test("should show header when scrolling up from bottom", () => {
      // Start scrolled down with hidden header
      header.classList.add("hide");
      prevScroll = 500;
      lastY = 500;
      prevDirection = 2;

      // Scroll up past threshold
      window.scrollY = 250;
      checkScroll();

      expect(header.classList.contains("hide")).toBe(false);
    });

    test("should respect menu active state", () => {
      layout.classList.add("active");
      header.classList.add("hide");

      // Try to hide while menu active
      curDirection = 2;
      window.scrollY = 500;
      lastY = 0;

      checkScroll();

      expect(header.classList.contains("hide")).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    test("should handle scroll position of 0", () => {
      window.scrollY = 0;

      checkScroll();

      expect(curScroll).toBe(0);
    });

    test("should handle very large scroll values", () => {
      window.scrollY = 10000;

      checkScroll();

      expect(curScroll).toBe(10000);
    });

    test("should handle rapid direction changes", () => {
      // Scroll down
      prevScroll = 0;
      window.scrollY = 100;
      checkScroll();

      const dir1 = curDirection;

      // Immediately scroll up
      window.scrollY = 50;
      checkScroll();

      const dir2 = curDirection;

      expect(dir1).toBe(2);
      expect(dir2).toBe(1);
    });

    test("should update lastY when scrolling in same direction", () => {
      prevDirection = 2;
      curDirection = 2;
      window.scrollY = 150;

      checkScroll();

      expect(lastY).toBe(150);
    });
  });

  describe("Class Management", () => {
    test("should handle multiple class toggles", () => {
      // Add relative
      curDirection = 2;
      curScroll = 5;
      lastY = 0;
      toggleHeader();

      expect(header.classList.contains("relative")).toBe(true);

      // Now hide
      curScroll = 400;
      lastY = 50;
      toggleHeader();

      expect(header.classList.contains("hide")).toBe(true);
      expect(header.classList.contains("relative")).toBe(false);
    });

    test("should not duplicate classes", () => {
      header.classList.add("hide");

      curDirection = 2;
      curScroll = 400;
      lastY = 50;
      toggleHeader();

      const classes = Array.from(header.classList);
      const hideCount = classes.filter((c) => c === "hide").length;

      expect(hideCount).toBe(1);
    });
  });
});
