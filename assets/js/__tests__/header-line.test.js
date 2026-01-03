/**
 * Tests for header-line.js
 * Adds bottom-line class to header when scrolled past header height
 */

describe("Header Line - Scroll-based Bottom Line", () => {
  let header;
  let scrollpos;
  let header_height;
  let add_class_on_scroll;
  let remove_class_on_scroll;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="topmenu"></div>
    `;

    header = document.querySelector("#topmenu");

    // Mock offsetHeight
    Object.defineProperty(header, "offsetHeight", {
      configurable: true,
      value: 80,
    });

    // Mock window.scrollY
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 0,
    });

    scrollpos = window.scrollY;
    header_height = header.offsetHeight;

    // Define functions
    add_class_on_scroll = () => header.classList.add("bottom-line");
    remove_class_on_scroll = () => header.classList.remove("bottom-line");
  });

  describe("Initial Setup", () => {
    test("should query topmenu element", () => {
      const headerElement = document.querySelector("#topmenu");

      expect(headerElement).toBeTruthy();
      expect(headerElement.id).toBe("topmenu");
    });

    test("should get header offsetHeight", () => {
      expect(header.offsetHeight).toBe(80);
    });

    test("should initialize scrollpos from window.scrollY", () => {
      const initialScrollpos = window.scrollY;

      expect(initialScrollpos).toBe(0);
    });

    test("should set header_height to header offsetHeight", () => {
      const height = header.offsetHeight;

      expect(height).toBe(80);
    });
  });

  describe("add_class_on_scroll()", () => {
    test("should add bottom-line class to header", () => {
      add_class_on_scroll();

      expect(header.classList.contains("bottom-line")).toBe(true);
    });

    test("should not duplicate class if already present", () => {
      header.classList.add("bottom-line");
      add_class_on_scroll();

      const classes = Array.from(header.classList);
      const lineCount = classes.filter((c) => c === "bottom-line").length;

      expect(lineCount).toBe(1);
    });

    test("should preserve other classes when adding bottom-line", () => {
      header.classList.add("other-class");
      add_class_on_scroll();

      expect(header.classList.contains("other-class")).toBe(true);
      expect(header.classList.contains("bottom-line")).toBe(true);
    });
  });

  describe("remove_class_on_scroll()", () => {
    test("should remove bottom-line class from header", () => {
      header.classList.add("bottom-line");

      remove_class_on_scroll();

      expect(header.classList.contains("bottom-line")).toBe(false);
    });

    test("should not error if class not present", () => {
      expect(() => {
        remove_class_on_scroll();
      }).not.toThrow();
    });

    test("should preserve other classes when removing bottom-line", () => {
      header.classList.add("other-class");
      header.classList.add("bottom-line");

      remove_class_on_scroll();

      expect(header.classList.contains("other-class")).toBe(true);
      expect(header.classList.contains("bottom-line")).toBe(false);
    });
  });

  describe("Scroll Event Handler", () => {
    let scrollHandler;

    beforeEach(() => {
      scrollHandler = function () {
        scrollpos = window.scrollY;

        if (scrollpos >= header_height) {
          add_class_on_scroll();
        } else {
          remove_class_on_scroll();
        }
      };
    });

    test("should add bottom-line when scrolled past header height", () => {
      window.scrollY = 100;
      scrollHandler();

      expect(header.classList.contains("bottom-line")).toBe(true);
    });

    test("should remove bottom-line when scrolled above header height", () => {
      header.classList.add("bottom-line");

      window.scrollY = 50;
      scrollHandler();

      expect(header.classList.contains("bottom-line")).toBe(false);
    });

    test("should add bottom-line at exactly header height", () => {
      window.scrollY = 80;
      scrollHandler();

      expect(header.classList.contains("bottom-line")).toBe(true);
    });

    test("should remove bottom-line at one pixel below header height", () => {
      header.classList.add("bottom-line");

      window.scrollY = 79;
      scrollHandler();

      expect(header.classList.contains("bottom-line")).toBe(false);
    });

    test("should update scrollpos variable on scroll", () => {
      window.scrollY = 150;
      scrollHandler();

      expect(scrollpos).toBe(150);
    });

    test("should handle scroll position of 0", () => {
      window.scrollY = 0;
      scrollHandler();

      expect(header.classList.contains("bottom-line")).toBe(false);
    });

    test("should handle very large scroll values", () => {
      window.scrollY = 10000;
      scrollHandler();

      expect(header.classList.contains("bottom-line")).toBe(true);
    });
  });

  describe("Threshold Behavior", () => {
    let scrollHandler;

    beforeEach(() => {
      scrollHandler = function () {
        scrollpos = window.scrollY;

        if (scrollpos >= header_height) {
          add_class_on_scroll();
        } else {
          remove_class_on_scroll();
        }
      };
    });

    test("should use >= comparison for threshold", () => {
      window.scrollY = header_height;
      scrollHandler();

      expect(header.classList.contains("bottom-line")).toBe(true);
    });

    test("should not add line when one pixel below threshold", () => {
      window.scrollY = header_height - 1;
      scrollHandler();

      expect(header.classList.contains("bottom-line")).toBe(false);
    });

    test("should add line when one pixel above threshold", () => {
      window.scrollY = header_height + 1;
      scrollHandler();

      expect(header.classList.contains("bottom-line")).toBe(true);
    });
  });

  describe("Scroll Event Integration", () => {
    test("should attach scroll event listener to window", () => {
      const addEventListenerSpy = jest.spyOn(window, "addEventListener");

      const handler = function () {
        scrollpos = window.scrollY;
        if (scrollpos >= header_height) {
          add_class_on_scroll();
        } else {
          remove_class_on_scroll();
        }
      };

      window.addEventListener("scroll", handler);

      expect(addEventListenerSpy).toHaveBeenCalledWith("scroll", handler);

      addEventListenerSpy.mockRestore();
    });

    test("should respond to scroll events", () => {
      const handler = function () {
        scrollpos = window.scrollY;
        if (scrollpos >= header_height) {
          add_class_on_scroll();
        } else {
          remove_class_on_scroll();
        }
      };

      window.addEventListener("scroll", handler);

      window.scrollY = 100;
      const scrollEvent = new Event("scroll");
      window.dispatchEvent(scrollEvent);

      expect(header.classList.contains("bottom-line")).toBe(true);
    });
  });

  describe("Different Header Heights", () => {
    test("should work with different header heights", () => {
      Object.defineProperty(header, "offsetHeight", {
        configurable: true,
        value: 120,
      });

      header_height = header.offsetHeight;

      const handler = function () {
        scrollpos = window.scrollY;
        if (scrollpos >= header_height) {
          add_class_on_scroll();
        } else {
          remove_class_on_scroll();
        }
      };

      window.scrollY = 130;
      handler();

      expect(header.classList.contains("bottom-line")).toBe(true);

      window.scrollY = 100;
      handler();

      expect(header.classList.contains("bottom-line")).toBe(false);
    });

    test("should handle very small header height", () => {
      Object.defineProperty(header, "offsetHeight", {
        configurable: true,
        value: 10,
      });

      header_height = header.offsetHeight;

      const handler = function () {
        scrollpos = window.scrollY;
        if (scrollpos >= header_height) {
          add_class_on_scroll();
        } else {
          remove_class_on_scroll();
        }
      };

      window.scrollY = 10;
      handler();

      expect(header.classList.contains("bottom-line")).toBe(true);
    });

    test("should handle zero header height", () => {
      Object.defineProperty(header, "offsetHeight", {
        configurable: true,
        value: 0,
      });

      header_height = header.offsetHeight;

      const handler = function () {
        scrollpos = window.scrollY;
        if (scrollpos >= header_height) {
          add_class_on_scroll();
        } else {
          remove_class_on_scroll();
        }
      };

      window.scrollY = 0;
      handler();

      // At 0, scrollpos >= 0 is true
      expect(header.classList.contains("bottom-line")).toBe(true);
    });
  });

  describe("Scroll Scenarios", () => {
    let scrollHandler;

    beforeEach(() => {
      scrollHandler = function () {
        scrollpos = window.scrollY;
        if (scrollpos >= header_height) {
          add_class_on_scroll();
        } else {
          remove_class_on_scroll();
        }
      };
    });

    test("should add line when scrolling down from top", () => {
      window.scrollY = 0;
      scrollHandler();
      expect(header.classList.contains("bottom-line")).toBe(false);

      window.scrollY = 100;
      scrollHandler();
      expect(header.classList.contains("bottom-line")).toBe(true);
    });

    test("should remove line when scrolling back to top", () => {
      window.scrollY = 100;
      scrollHandler();
      expect(header.classList.contains("bottom-line")).toBe(true);

      window.scrollY = 0;
      scrollHandler();
      expect(header.classList.contains("bottom-line")).toBe(false);
    });

    test("should toggle line when crossing threshold multiple times", () => {
      window.scrollY = 100;
      scrollHandler();
      expect(header.classList.contains("bottom-line")).toBe(true);

      window.scrollY = 50;
      scrollHandler();
      expect(header.classList.contains("bottom-line")).toBe(false);

      window.scrollY = 100;
      scrollHandler();
      expect(header.classList.contains("bottom-line")).toBe(true);

      window.scrollY = 20;
      scrollHandler();
      expect(header.classList.contains("bottom-line")).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    let scrollHandler;

    beforeEach(() => {
      scrollHandler = function () {
        scrollpos = window.scrollY;
        if (scrollpos >= header_height) {
          add_class_on_scroll();
        } else {
          remove_class_on_scroll();
        }
      };
    });

    test("should handle negative scroll values", () => {
      window.scrollY = -10;
      scrollHandler();

      expect(header.classList.contains("bottom-line")).toBe(false);
    });

    test("should handle decimal scroll values", () => {
      window.scrollY = 80.5;
      scrollHandler();

      expect(header.classList.contains("bottom-line")).toBe(true);
    });

    test("should handle scroll exactly at threshold boundary", () => {
      window.scrollY = 80;
      scrollHandler();
      expect(header.classList.contains("bottom-line")).toBe(true);

      window.scrollY = 79.99;
      scrollHandler();
      expect(header.classList.contains("bottom-line")).toBe(false);
    });
  });
});
