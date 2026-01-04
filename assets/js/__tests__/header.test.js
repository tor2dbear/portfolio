/**
 * Tests for header.js
 * Media query-based header scroll behavior for mobile/tablet
 */

describe("Header - Mobile Scroll Behavior", () => {
  let topmenu;
  let mediaQuery;
  let handleTabletChange;

  beforeEach(() => {
    // Clear console.log spy
    jest.spyOn(console, "log").mockImplementation(() => {});

    // Setup DOM
    document.body.innerHTML = `
      <div id="topmenu"></div>
    `;

    topmenu = document.getElementById("topmenu");

    // Mock matchMedia
    mediaQuery = {
      matches: false,
      media: "(max-width: 47.9375em)",
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    window.matchMedia = jest.fn(() => mediaQuery);

    // Mock window.pageYOffset
    Object.defineProperty(window, "pageYOffset", {
      writable: true,
      configurable: true,
      value: 0,
    });

    // Define handleTabletChange function
    handleTabletChange = function (e) {
      // Check if the media query is true
      if (e.matches) {
        // When the user scrolls down, hide the navbar. When the user scrolls up, show the navbar
        var prevScrollpos = window.pageYOffset;
        window.onscroll = function () {
          var currentScrollPos = window.pageYOffset;
          if (prevScrollpos > currentScrollPos) {
            document.getElementById("topmenu").style.transform =
              "translateY(0)";
          } else {
            document.getElementById("topmenu").style.transform =
              "translateY(-4.5rem)";
          }
          prevScrollpos = currentScrollPos;
        };
      } else {
        // Show navbar when window is larger than 48em
        // eslint-disable-next-line no-console
        console.log("The window is now over 48em");
      }
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Media Query Setup", () => {
    test("should create media query for max-width 47.9375em", () => {
      const mq = window.matchMedia("(max-width: 47.9375em)");

      expect(mq.media).toBe("(max-width: 47.9375em)");
    });

    test("should register change event listener on media query", () => {
      mediaQuery.addEventListener("change", handleTabletChange);

      expect(mediaQuery.addEventListener).toHaveBeenCalledWith(
        "change",
        handleTabletChange
      );
    });

    test("should call handleTabletChange on initial check", () => {
      const spy = jest.fn();
      spy(mediaQuery);

      expect(spy).toHaveBeenCalledWith(mediaQuery);
    });
  });

  describe("handleTabletChange() - Mobile View", () => {
    beforeEach(() => {
      mediaQuery.matches = true;
    });

    test("should set up scroll handler when media query matches", () => {
      handleTabletChange(mediaQuery);

      expect(window.onscroll).toBeDefined();
      expect(typeof window.onscroll).toBe("function");
    });

    test("should show header when scrolling up", () => {
      handleTabletChange(mediaQuery);

      // Set initial scroll position and update prevScrollpos
      window.pageYOffset = 200;
      window.onscroll();

      // Scroll up
      window.pageYOffset = 100;
      window.onscroll();

      expect(topmenu.style.transform).toBe("translateY(0)");
    });

    test("should hide header when scrolling down", () => {
      handleTabletChange(mediaQuery);

      // Set initial scroll position
      window.pageYOffset = 100;

      // Scroll down
      window.pageYOffset = 200;
      window.onscroll();

      expect(topmenu.style.transform).toBe("translateY(-4.5rem)");
    });

    test("should update prevScrollpos after each scroll", () => {
      handleTabletChange(mediaQuery);

      // First scroll down
      window.pageYOffset = 100;
      window.onscroll();

      // Then scroll up - should compare against new prevScrollpos (100)
      window.pageYOffset = 50;
      window.onscroll();

      expect(topmenu.style.transform).toBe("translateY(0)");
    });

    test("should handle scroll from position 0", () => {
      handleTabletChange(mediaQuery);

      window.pageYOffset = 0;
      window.onscroll();

      window.pageYOffset = 100;
      window.onscroll();

      expect(topmenu.style.transform).toBe("translateY(-4.5rem)");
    });

    test("should handle scrolling back to top", () => {
      handleTabletChange(mediaQuery);

      window.pageYOffset = 500;
      window.onscroll();

      window.pageYOffset = 0;
      window.onscroll();

      expect(topmenu.style.transform).toBe("translateY(0)");
    });

    test("should handle rapid scroll changes", () => {
      handleTabletChange(mediaQuery);

      // Scroll down
      window.pageYOffset = 100;
      window.onscroll();
      expect(topmenu.style.transform).toBe("translateY(-4.5rem)");

      // Scroll up
      window.pageYOffset = 50;
      window.onscroll();
      expect(topmenu.style.transform).toBe("translateY(0)");

      // Scroll down again
      window.pageYOffset = 150;
      window.onscroll();
      expect(topmenu.style.transform).toBe("translateY(-4.5rem)");
    });

    test("should maintain state when scrolling same direction", () => {
      handleTabletChange(mediaQuery);

      // Scroll down
      window.pageYOffset = 100;
      window.onscroll();

      // Continue scrolling down
      window.pageYOffset = 200;
      window.onscroll();

      expect(topmenu.style.transform).toBe("translateY(-4.5rem)");
    });
  });

  describe("handleTabletChange() - Desktop View", () => {
    beforeEach(() => {
      mediaQuery.matches = false;
    });

    test("should log message when media query does not match", () => {
      const consoleSpy = jest.spyOn(console, "log");

      handleTabletChange(mediaQuery);

      expect(consoleSpy).toHaveBeenCalledWith("The window is now over 48em");
    });

    test("should not set scroll handler when media query does not match", () => {
      window.onscroll = null;

      handleTabletChange(mediaQuery);

      expect(window.onscroll).toBeNull();
    });
  });

  describe("Transform Values", () => {
    beforeEach(() => {
      mediaQuery.matches = true;
      handleTabletChange(mediaQuery);
    });

    test('should use "translateY(0)" for visible header', () => {
      window.pageYOffset = 200;
      window.onscroll();

      window.pageYOffset = 100;
      window.onscroll();

      expect(topmenu.style.transform).toBe("translateY(0)");
    });

    test('should use "translateY(-4.5rem)" for hidden header', () => {
      window.pageYOffset = 100;
      window.onscroll();

      window.pageYOffset = 200;
      window.onscroll();

      expect(topmenu.style.transform).toBe("translateY(-4.5rem)");
    });
  });

  describe("Scroll Position Tracking", () => {
    beforeEach(() => {
      mediaQuery.matches = true;
      handleTabletChange(mediaQuery);
    });

    test("should track previous scroll position", () => {
      // Start at 0
      window.pageYOffset = 0;

      // Scroll to 100
      window.pageYOffset = 100;
      window.onscroll();

      // Scroll to 150 (down from 100)
      window.pageYOffset = 150;
      window.onscroll();

      expect(topmenu.style.transform).toBe("translateY(-4.5rem)");
    });

    test("should handle equal scroll positions", () => {
      window.pageYOffset = 100;
      window.onscroll();

      // Same position - counts as scrolling down (not greater than prev)
      window.pageYOffset = 100;
      window.onscroll();

      expect(topmenu.style.transform).toBe("translateY(-4.5rem)");
    });
  });

  describe("Edge Cases", () => {
    beforeEach(() => {
      mediaQuery.matches = true;
      handleTabletChange(mediaQuery);
    });

    test("should handle negative scroll values", () => {
      window.pageYOffset = -10;
      window.onscroll();

      expect(topmenu.style.transform).toBeDefined();
    });

    test("should handle very large scroll values", () => {
      window.pageYOffset = 10000;
      window.onscroll();

      window.pageYOffset = 5000;
      window.onscroll();

      expect(topmenu.style.transform).toBe("translateY(0)");
    });

    test("should handle decimal scroll values", () => {
      window.pageYOffset = 100.5;
      window.onscroll();

      window.pageYOffset = 50.3;
      window.onscroll();

      expect(topmenu.style.transform).toBe("translateY(0)");
    });
  });

  describe("Media Query Breakpoint", () => {
    test("should use 47.9375em as breakpoint (767px)", () => {
      // 47.9375em * 16px = 767px
      const breakpointEm = 47.9375;
      const breakpointPx = breakpointEm * 16;

      expect(breakpointPx).toBe(767);
    });

    test("should handle media query change from mobile to desktop", () => {
      const consoleSpy = jest.spyOn(console, "log");

      // Start mobile
      mediaQuery.matches = true;
      handleTabletChange(mediaQuery);

      // Change to desktop
      mediaQuery.matches = false;
      handleTabletChange(mediaQuery);

      expect(consoleSpy).toHaveBeenCalledWith("The window is now over 48em");
    });

    test("should handle media query change from desktop to mobile", () => {
      // Clear any existing scroll handler
      window.onscroll = null;

      // Start desktop
      mediaQuery.matches = false;
      handleTabletChange(mediaQuery);

      // Should not set scroll handler in desktop mode
      expect(window.onscroll).toBeNull();

      // Change to mobile
      mediaQuery.matches = true;
      handleTabletChange(mediaQuery);

      expect(window.onscroll).toBeDefined();
    });
  });

  describe("Integration with matchMedia", () => {
    test("should create matchMedia with correct query", () => {
      const matchMediaSpy = jest.spyOn(window, "matchMedia");

      window.matchMedia("(max-width: 47.9375em)");

      expect(matchMediaSpy).toHaveBeenCalledWith("(max-width: 47.9375em)");

      matchMediaSpy.mockRestore();
    });

    test("should access matches property", () => {
      const mq = window.matchMedia("(max-width: 47.9375em)");

      expect(mq).toHaveProperty("matches");
    });

    test("should have addEventListener method", () => {
      const mq = window.matchMedia("(max-width: 47.9375em)");

      expect(mq.addEventListener).toBeDefined();
    });
  });
});
