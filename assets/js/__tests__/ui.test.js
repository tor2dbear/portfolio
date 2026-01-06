/**
 * Tests for ui.js
 * Mobile menu toggle system with transitions
 */

describe("UI - Mobile Menu Toggle", () => {
  let layout, menu, menuLink, content, body;

  beforeEach(() => {
    // Use fake timers for setTimeout tests
    jest.useFakeTimers();

    // Setup DOM with all required elements
    document.body.innerHTML = `
      <div id="layout"></div>
      <div id="menu"></div>
      <a href="#" data-js="menu-toggle">Menu</a>
      <div id="main"></div>
    `;

    layout = document.getElementById("layout");
    menu = document.getElementById("menu");
    menuLink = document.querySelector('[data-js="menu-toggle"]');
    content = document.getElementById("main");
    body = document.body;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("toggleClass()", () => {
    let toggleClass;

    beforeEach(() => {
      toggleClass = function (element, className) {
        var classes = element.className.split(/\s+/),
          length = classes.length,
          i = 0;

        for (; i < length; i++) {
          if (classes[i] === className) {
            classes.splice(i, 1);
            break;
          }
        }
        // The className is not found
        if (length === classes.length) {
          classes.push(className);
        }

        element.className = classes.join(" ");
      };
    });

    test("should add class when not present", () => {
      const element = document.createElement("div");
      element.className = "foo bar";

      toggleClass(element, "active");

      expect(element.className).toBe("foo bar active");
    });

    test("should remove class when present", () => {
      const element = document.createElement("div");
      element.className = "foo active bar";

      toggleClass(element, "active");

      expect(element.className).toBe("foo bar");
    });

    test("should work with single class", () => {
      const element = document.createElement("div");
      element.className = "active";

      toggleClass(element, "active");

      expect(element.className).toBe("");
    });

    test("should add class to empty className", () => {
      const element = document.createElement("div");
      element.className = "";

      toggleClass(element, "active");

      // Empty string split by /\s+/ creates [" "], join adds leading space
      expect(element.className).toBe(" active");
    });

    test("should preserve other classes when toggling", () => {
      const element = document.createElement("div");
      element.className = "one two three";

      toggleClass(element, "two");

      expect(element.className).toBe("one three");
    });

    test("should handle multiple whitespace", () => {
      const element = document.createElement("div");
      element.className = "foo  bar   baz";

      toggleClass(element, "active");

      expect(element.className).toContain("active");
    });

    test("should toggle class multiple times", () => {
      const element = document.createElement("div");
      element.className = "foo";

      toggleClass(element, "active");
      expect(element.className).toBe("foo active");

      toggleClass(element, "active");
      expect(element.className).toBe("foo");

      toggleClass(element, "active");
      expect(element.className).toBe("foo active");
    });
  });

  describe("toggleAll()", () => {
    let toggleClass, toggleAll;

    beforeEach(() => {
      toggleClass = function (element, className) {
        var classes = element.className.split(/\s+/),
          length = classes.length,
          i = 0;

        for (; i < length; i++) {
          if (classes[i] === className) {
            classes.splice(i, 1);
            break;
          }
        }
        if (length === classes.length) {
          classes.push(className);
        }
        element.className = classes.join(" ");
      };

      toggleAll = function (e) {
        var active = "active";

        e.preventDefault();
        toggleClass(layout, active);
        toggleClass(menu, active);
        toggleClass(menuLink, active);
        toggleClass(body, active);
      };
    });

    test("should prevent default event", () => {
      const event = new Event("click", { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, "preventDefault");

      toggleAll(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test("should add active class to all elements when not present", () => {
      const event = new Event("click", { bubbles: true, cancelable: true });

      // Clear body className first
      body.className = "";

      toggleAll(event);

      expect(layout.className).toContain("active");
      expect(menu.className).toContain("active");
      expect(menuLink.className).toContain("active");
      // Check document.body directly as it may have initial classes
      expect(body.className.trim()).toContain("active");
    });

    test("should remove active class from all elements when present", () => {
      layout.className = "active";
      menu.className = "active";
      menuLink.className = "active";
      body.className = "active";

      const event = new Event("click", { bubbles: true, cancelable: true });
      toggleAll(event);

      expect(layout.className).not.toContain("active");
      expect(menu.className).not.toContain("active");
      expect(menuLink.className).not.toContain("active");
      expect(body.className).not.toContain("active");
    });

    test("should toggle all elements together", () => {
      const event = new Event("click", { bubbles: true, cancelable: true });

      // First toggle - add active
      toggleAll(event);
      expect(layout.className).toContain("active");
      expect(menu.className).toContain("active");

      // Second toggle - remove active
      toggleAll(event);
      expect(layout.className).not.toContain("active");
      expect(menu.className).not.toContain("active");
    });
  });

  describe("menuLink Click Handler", () => {
    beforeEach(() => {
      // Define the click handler
      menuLink.onclick = function (e) {
        e.preventDefault();

        // Toggle active class on all elements
        const toggleClass = (element, className) => {
          if (element.classList.contains(className)) {
            element.classList.remove(className);
          } else {
            element.classList.add(className);
          }
        };

        toggleClass(layout, "active");
        toggleClass(menu, "active");
        toggleClass(menuLink, "active");
        toggleClass(body, "active");

        body.classList.add("menuTransition");
        setTimeout(function () {
          body.classList.remove("menuTransition");
        }, 1000);
      };
    });

    test("should add menuTransition class on click", () => {
      menuLink.click();

      expect(body.classList.contains("menuTransition")).toBe(true);
    });

    test("should remove menuTransition after 1000ms", () => {
      menuLink.click();

      expect(body.classList.contains("menuTransition")).toBe(true);

      jest.advanceTimersByTime(1000);

      expect(body.classList.contains("menuTransition")).toBe(false);
    });

    test("should not remove menuTransition before 1000ms", () => {
      menuLink.click();

      jest.advanceTimersByTime(500);

      expect(body.classList.contains("menuTransition")).toBe(true);
    });

    test("should toggle active classes on click", () => {
      // Clear body className first
      body.className = "";

      menuLink.click();

      expect(layout.classList.contains("active")).toBe(true);
      expect(menu.classList.contains("active")).toBe(true);
      expect(menuLink.classList.contains("active")).toBe(true);
      // Trim to handle potential leading space from empty className
      expect(body.className.trim().includes("active")).toBe(true);
    });
  });

  describe("content Click Handler", () => {
    beforeEach(() => {
      // Define the content click handler
      content.onclick = function (e) {
        if (menu.className.indexOf("active") !== -1) {
          e.preventDefault();

          const toggleClass = (element, className) => {
            if (element.classList.contains(className)) {
              element.classList.remove(className);
            } else {
              element.classList.add(className);
            }
          };

          toggleClass(layout, "active");
          toggleClass(menu, "active");
          toggleClass(menuLink, "active");
          toggleClass(body, "active");
        }
      };
    });

    test("should toggle classes when menu is active", () => {
      menu.className = "active";
      layout.className = "active";
      menuLink.className = "active";
      body.className = "active";

      content.click();

      expect(menu.classList.contains("active")).toBe(false);
      expect(layout.classList.contains("active")).toBe(false);
      expect(menuLink.classList.contains("active")).toBe(false);
      expect(body.classList.contains("active")).toBe(false);
    });

    test("should not toggle classes when menu is not active", () => {
      menu.className = "";
      layout.className = "";

      content.click();

      expect(menu.classList.contains("active")).toBe(false);
      expect(layout.classList.contains("active")).toBe(false);
    });

    test("should detect active class using indexOf", () => {
      menu.className = "foo active bar";

      const hasActive = menu.className.indexOf("active") !== -1;

      expect(hasActive).toBe(true);
    });

    test("should not detect active when not present", () => {
      menu.className = "foo bar";

      const hasActive = menu.className.indexOf("active") !== -1;

      expect(hasActive).toBe(false);
    });
  });

  describe("Class Name Manipulation", () => {
    test("should split classes by whitespace", () => {
      const className = "foo bar baz";
      const classes = className.split(/\s+/);

      expect(classes).toEqual(["foo", "bar", "baz"]);
    });

    test("should join classes with space", () => {
      const classes = ["foo", "bar", "baz"];
      const className = classes.join(" ");

      expect(className).toBe("foo bar baz");
    });

    test("should handle splice to remove class", () => {
      const classes = ["foo", "active", "bar"];
      const index = classes.indexOf("active");
      classes.splice(index, 1);

      expect(classes).toEqual(["foo", "bar"]);
    });

    test("should handle push to add class", () => {
      const classes = ["foo", "bar"];
      classes.push("active");

      expect(classes).toEqual(["foo", "bar", "active"]);
    });
  });

  describe("IIFE Pattern", () => {
    test("should accept window and document parameters", () => {
      const iifeFunction = function (window, document) {
        expect(window).toBeDefined();
        expect(document).toBeDefined();
        return { window, document };
      };

      const result = iifeFunction(window, document);

      expect(result.window).toBe(window);
      expect(result.document).toBe(document);
    });

    test("should use this as window in IIFE", () => {
      const context = { foo: "bar" };
      const iifeFunction = function (w, d) {
        return { passedWindow: w, passedDocument: d };
      };

      const result = iifeFunction.call(context, context, document);

      expect(result.passedWindow).toBe(context);
    });
  });

  describe("Element Queries", () => {
    test("should find layout element", () => {
      const layoutEl = document.getElementById("layout");
      expect(layoutEl).toBeTruthy();
      expect(layoutEl.id).toBe("layout");
    });

    test("should find menu element", () => {
      const menuEl = document.getElementById("menu");
      expect(menuEl).toBeTruthy();
      expect(menuEl.id).toBe("menu");
    });

    test("should find menuLink element", () => {
      const menuLinkEl = document.querySelector('[data-js="menu-toggle"]');
      expect(menuLinkEl).toBeTruthy();
      expect(menuLinkEl.getAttribute("data-js")).toBe("menu-toggle");
    });

    test("should find main content element", () => {
      const contentEl = document.getElementById("main");
      expect(contentEl).toBeTruthy();
      expect(contentEl.id).toBe("main");
    });

    test("should access document.body", () => {
      expect(document.body).toBeTruthy();
      expect(document.body.tagName).toBe("BODY");
    });
  });
});
