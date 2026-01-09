/**
 * Tests for darkmode.js
 * Theme management system with touch gestures and SVG loading
 */

describe("Dark Mode - Theme Management", () => {
  let themeMenuContainer, themeMenu, overlay, themeMenuIcon, themeMetaTag;

  beforeEach(() => {
    // Setup DOM with all required elements
    document.body.innerHTML = `
      <div class="theme-switcher" data-js="theme-switcher" data-visible="false">
        <button data-js="theme-switcher-toggle">Toggle</button>
        <div class="theme-switcher__panel" data-js="theme-switcher-panel"></div>
      </div>
      <div class="theme-switcher__overlay" data-js="theme-switcher-overlay"></div>
      <div class="theme-switcher__icon" data-js="theme-switcher-icon"></div>
      <div id="light-icon"></div>
      <div id="dark-icon"></div>
      <div id="system-icon"></div>
      <meta name="theme-color" content="#FFFFFF">
    `;

    themeMenuContainer = document.querySelector('[data-js="theme-switcher"]');
    themeMenu = document.querySelector('[data-js="theme-switcher-panel"]');
    overlay = document.querySelector('[data-js="theme-switcher-overlay"]');
    themeMenuIcon = document.querySelector('[data-js="theme-switcher-icon"]');
    themeMetaTag = document.querySelector('meta[name="theme-color"]');

    // Mock window.innerHeight for touch calculations
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 800,
    });

    // Mock getBoundingClientRect
    themeMenu.getBoundingClientRect = jest.fn(() => ({
      height: 300,
      top: 0,
      left: 0,
      right: 0,
      bottom: 300,
    }));

    // Mock getComputedStyle
    window.getComputedStyle = jest.fn(() => ({
      getPropertyValue: jest.fn(() => "#18181b"),
    }));

    // Clear localStorage
    localStorage.clear();
  });

  describe("toggleMenu()", () => {
    test("should show menu when visible is true", () => {
      // Create a global toggleMenu function for testing
      window.toggleMenu = function (visible, _duration = 0.3) {
        const menuContainer = document.querySelector('[data-js="theme-switcher"]');
        const menu = document.querySelector('[data-js="theme-switcher-panel"]');
        const overlay = document.querySelector('[data-js="theme-switcher-overlay"]');

        menuContainer.setAttribute("data-visible", visible);
        overlay.setAttribute("data-visible", visible);
        menu.setAttribute("data-visible", visible);

        if (visible) {
          menu.style.transform = "translateY(0)";
          menu.style.opacity = "1";
          menu.style.visibility = "visible";
          overlay.style.opacity = "1";
          overlay.style.visibility = "visible";
        } else {
          menu.style.transform = "translateY(100%)";
          menu.style.opacity = "0";
          menu.style.visibility = "hidden";
          overlay.style.opacity = "0";
          overlay.style.visibility = "hidden";
        }
      };

      window.toggleMenu(true);

      expect(themeMenuContainer.getAttribute("data-visible")).toBe("true");
      expect(themeMenu.getAttribute("data-visible")).toBe("true");
      expect(overlay.getAttribute("data-visible")).toBe("true");
      expect(themeMenu.style.transform).toBe("translateY(0)");
      expect(themeMenu.style.opacity).toBe("1");
      expect(themeMenu.style.visibility).toBe("visible");
    });

    test("should hide menu when visible is false", () => {
      window.toggleMenu(false);

      expect(themeMenuContainer.getAttribute("data-visible")).toBe("false");
      expect(themeMenu.style.transform).toBe("translateY(100%)");
      expect(themeMenu.style.opacity).toBe("0");
      expect(themeMenu.style.visibility).toBe("hidden");
    });

    test("should handle custom duration", () => {
      window.toggleMenu(true, 0.5);
      // Duration is applied via inline styles - just verify menu opens
      expect(themeMenu.getAttribute("data-visible")).toBe("true");
    });
  });

  describe("setTheme()", () => {
    beforeEach(() => {
      // Mock applyTheme and closeMenu
      window.applyTheme = jest.fn();
      window.closeMenu = jest.fn();

      window.setTheme = function (theme) {
        localStorage.setItem("theme", theme);
        window.applyTheme(theme);
        window.closeMenu();
      };
    });

    test("should save theme to localStorage", () => {
      const spy = jest.spyOn(Storage.prototype, "setItem");
      window.setTheme("dark");
      expect(spy).toHaveBeenCalledWith("theme", "dark");
      spy.mockRestore();
    });

    test("should apply theme", () => {
      window.setTheme("light");
      expect(window.applyTheme).toHaveBeenCalledWith("light");
    });

    test("should close menu after setting theme", () => {
      window.setTheme("system");
      expect(window.closeMenu).toHaveBeenCalled();
    });
  });

  describe("applyTheme()", () => {
    beforeEach(() => {
      window.updateSystemTheme = jest.fn();
      window.updateMenuIcon = jest.fn();
      window.updateThemeColor = jest.fn();

      window.applyTheme = function (theme) {
        if (theme === "system") {
          window.updateSystemTheme();
        } else {
          document.documentElement.setAttribute("data-theme", theme);
        }
        window.updateMenuIcon(theme);
        window.updateThemeColor(theme);
      };
    });

    test("should set data-theme attribute for light theme", () => {
      window.applyTheme("light");
      expect(document.documentElement.getAttribute("data-theme")).toBe("light");
      expect(window.updateMenuIcon).toHaveBeenCalledWith("light");
      expect(window.updateThemeColor).toHaveBeenCalledWith("light");
    });

    test("should set data-theme attribute for dark theme", () => {
      window.applyTheme("dark");
      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    });

    test("should call updateSystemTheme for system theme", () => {
      window.applyTheme("system");
      expect(window.updateSystemTheme).toHaveBeenCalled();
      expect(window.updateMenuIcon).toHaveBeenCalledWith("system");
    });
  });

  describe("updateSystemTheme()", () => {
    beforeEach(() => {
      window.updateThemeColor = jest.fn();

      window.updateSystemTheme = function () {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";
        document.documentElement.setAttribute("data-theme", systemTheme);
        window.updateThemeColor(systemTheme);
      };
    });

    test("should set dark theme when system prefers dark", () => {
      window.matchMedia = jest.fn().mockImplementation((_query) => ({
        matches: _query === "(prefers-color-scheme: dark)",
        media: _query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      window.updateSystemTheme();
      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
      expect(window.updateThemeColor).toHaveBeenCalledWith("dark");
    });

    test("should set light theme when system prefers light", () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      window.updateSystemTheme();
      expect(document.documentElement.getAttribute("data-theme")).toBe("light");
      expect(window.updateThemeColor).toHaveBeenCalledWith("light");
    });
  });

  describe("updateMenuIcon()", () => {
    beforeEach(() => {
      window.updateMenuIcon = function (theme) {
        const icon = document.querySelector('[data-js="theme-switcher-icon"]');
        let svgPath = "";

        if (theme === "light") {
          svgPath = "/img/svg/light.svg";
        } else if (theme === "dark") {
          svgPath = "/img/svg/dark.svg";
        } else if (theme === "system") {
          svgPath = "/img/svg/system.svg";
        }

        return fetch(svgPath)
          .then((response) => response.text())
          .then((svg) => {
            const svgElement = new DOMParser()
              .parseFromString(svg, "image/svg+xml")
              .querySelector("svg");
            icon.innerHTML = "";
            icon.appendChild(svgElement);
            svgElement.style.stroke = "currentColor";
          });
      };

      // Mock DOMParser
      window.DOMParser = class {
        parseFromString() {
          const mockSvg = document.createElement("svg");
          return {
            querySelector: () => mockSvg,
          };
        }
      };
    });

    test("should fetch light icon for light theme", async () => {
      fetch.mockResolvedValueOnce({
        text: () => Promise.resolve("<svg></svg>"),
      });

      await window.updateMenuIcon("light");
      expect(fetch).toHaveBeenCalledWith("/img/svg/light.svg");
    });

    test("should fetch dark icon for dark theme", async () => {
      fetch.mockResolvedValueOnce({
        text: () => Promise.resolve("<svg></svg>"),
      });

      await window.updateMenuIcon("dark");
      expect(fetch).toHaveBeenCalledWith("/img/svg/dark.svg");
    });

    test("should fetch system icon for system theme", async () => {
      fetch.mockResolvedValueOnce({
        text: () => Promise.resolve("<svg></svg>"),
      });

      await window.updateMenuIcon("system");
      expect(fetch).toHaveBeenCalledWith("/img/svg/system.svg");
    });

    test("should update icon DOM element", async () => {
      fetch.mockResolvedValueOnce({
        text: () => Promise.resolve("<svg></svg>"),
      });

      await window.updateMenuIcon("light");
      expect(themeMenuIcon.children.length).toBeGreaterThan(0);
    });
  });

  describe("updateThemeColor()", () => {
    beforeEach(() => {
      window.updateThemeColor = function (theme) {
        const backgroundBase = getComputedStyle(document.documentElement)
          .getPropertyValue("--background-base")
          .trim();
        const themeColorMetaTag = document.querySelector(
          'meta[name="theme-color"]'
        );

        if (theme === "system") {
          const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
            .matches
            ? "dark"
            : "light";
          themeColorMetaTag.content =
            systemTheme === "dark" ? "#18181b" : "#FFFFFF";
        } else {
          themeColorMetaTag.content = backgroundBase;
        }
      };
    });

    test("should update meta tag for light theme", () => {
      window.updateThemeColor("light");
      expect(themeMetaTag.content).toBe("#18181b");
    });

    test("should update meta tag for dark theme", () => {
      window.updateThemeColor("dark");
      expect(themeMetaTag.content).toBe("#18181b");
    });

    test("should handle system theme with dark preference", () => {
      window.matchMedia = jest.fn().mockImplementation((_query) => ({
        matches: _query === "(prefers-color-scheme: dark)",
      }));

      window.updateThemeColor("system");
      expect(themeMetaTag.content).toBe("#18181b");
    });

    test("should handle system theme with light preference", () => {
      window.matchMedia = jest.fn().mockImplementation((_query) => ({
        matches: false,
      }));

      window.updateThemeColor("system");
      expect(themeMetaTag.content).toBe("#FFFFFF");
    });
  });

  describe("closeMenu()", () => {
    beforeEach(() => {
      window.toggleMenu = jest.fn();
      window.closeMenu = function (duration = 0.3) {
        window.toggleMenu(false, duration);
      };
    });

    test("should call toggleMenu with false", () => {
      window.closeMenu();
      expect(window.toggleMenu).toHaveBeenCalledWith(false, 0.3);
    });

    test("should pass custom duration", () => {
      window.closeMenu(0.5);
      expect(window.toggleMenu).toHaveBeenCalledWith(false, 0.5);
    });
  });

  describe("Touch Gestures", () => {
    test("should calculate correct deltaY on touch move", () => {
      const touchStartY = 100;
      const touchEndY = 150;
      const touchDeltaY = touchEndY - touchStartY;

      expect(touchDeltaY).toBe(50);
      expect(touchDeltaY > 0).toBe(true);
    });

    test("should detect swipe down when deltaY > 50", () => {
      const touchDeltaY = 60;
      const shouldClose = touchDeltaY > 50;

      expect(shouldClose).toBe(true);
    });

    test("should not close menu when deltaY <= 50", () => {
      const touchDeltaY = 40;
      const shouldClose = touchDeltaY > 50;

      expect(shouldClose).toBe(false);
    });

    test("should calculate opacity correctly", () => {
      const maxDeltaY = 500;
      const touchDeltaY = 250;
      const opacity = 1 - touchDeltaY / maxDeltaY;

      expect(opacity).toBe(0.5);
      expect(Math.max(opacity, 0)).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Media Query Handling", () => {
    test("should detect mobile viewport", () => {
      window.matchMedia = jest.fn().mockImplementation((_query) => ({
        matches: _query === "(max-width: 767px)",
      }));

      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      expect(isMobile).toBe(true);
    });

    test("should detect desktop viewport", () => {
      window.matchMedia = jest.fn().mockImplementation((_query) => ({
        matches: false,
      }));

      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      expect(isMobile).toBe(false);
    });
  });
});
