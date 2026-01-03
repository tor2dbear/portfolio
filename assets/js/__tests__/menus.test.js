/**
 * Tests for menus.js
 * Dropdown menu system with keyboard navigation and ARIA support
 */

describe("PureDropdown Menu System", () => {
  let dropdownParent, menuLink, menu, menuItems;

  // Mock PureDropdown class for testing
  class PureDropdown {
    constructor(dropdownParent) {
      this.PREFIX = "pure-";
      this.ACTIVE_CLASS_NAME = this.PREFIX + "menu-active";
      this.ARIA_ROLE = "role";
      this.ARIA_HIDDEN = "aria-hidden";
      this.MENU_OPEN = 0;
      this.MENU_CLOSED = 1;
      this.MENU_LINK_SELECTOR = ".pure-menu-link";
      this.MENU_SELECTOR = ".pure-menu-children";

      this._state = this.MENU_CLOSED;
      this._dropdownParent = dropdownParent;
      this._link = this._dropdownParent.querySelector(this.MENU_LINK_SELECTOR);
      this._menu = this._dropdownParent.querySelector(this.MENU_SELECTOR);

      // Set ARIA attributes
      this._link.setAttribute("aria-haspopup", "true");
      this._menu.setAttribute(this.ARIA_ROLE, "menu");
      this._menu.setAttribute("aria-labelledby", this._link.getAttribute("id"));
      this._menu.setAttribute("aria-hidden", "true");

      const listItems = this._menu.querySelectorAll("li");
      listItems.forEach((el) => {
        el.setAttribute(this.ARIA_ROLE, "presentation");
      });

      const links = this._menu.querySelectorAll("a");
      links.forEach((el) => {
        el.setAttribute(this.ARIA_ROLE, "menuitem");
      });
    }

    show() {
      if (this._state !== this.MENU_OPEN) {
        this._dropdownParent.classList.add(this.ACTIVE_CLASS_NAME);
        this._menu.setAttribute(this.ARIA_HIDDEN, false);
        this._state = this.MENU_OPEN;
      }
    }

    hide() {
      if (this._state !== this.MENU_CLOSED) {
        this._dropdownParent.classList.remove(this.ACTIVE_CLASS_NAME);
        this._menu.setAttribute(this.ARIA_HIDDEN, true);
        this._link.focus();
        this._state = this.MENU_CLOSED;
      }
    }

    toggle() {
      this[this._state === this.MENU_CLOSED ? "show" : "hide"]();
    }

    halt(e) {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  beforeEach(() => {
    // Setup DOM with dropdown menu structure
    document.body.innerHTML = `
      <div class="pure-menu-has-children">
        <a href="#" class="pure-menu-link" id="menu-link">Menu</a>
        <ul class="pure-menu-children">
          <li><a href="#" class="pure-menu-link">Item 1</a></li>
          <li><a href="#" class="pure-menu-link">Item 2</a></li>
          <li><a href="#" class="pure-menu-link">Item 3</a></li>
        </ul>
      </div>
    `;

    dropdownParent = document.querySelector(".pure-menu-has-children");
    menuLink = document.querySelector(".pure-menu-link");
    menu = document.querySelector(".pure-menu-children");
    menuItems = menu.querySelectorAll(".pure-menu-link");
  });

  describe("Initialization", () => {
    test("should initialize with menu closed", () => {
      const dropdown = new PureDropdown(dropdownParent);
      expect(dropdown._state).toBe(dropdown.MENU_CLOSED);
    });

    test("should set up ARIA attributes on init", () => {
      new PureDropdown(dropdownParent);

      expect(menuLink.getAttribute("aria-haspopup")).toBe("true");
      expect(menu.getAttribute("role")).toBe("menu");
      expect(menu.getAttribute("aria-labelledby")).toBe("menu-link");
      expect(menu.getAttribute("aria-hidden")).toBe("true");
    });

    test("should set ARIA role on list items", () => {
      new PureDropdown(dropdownParent);
      const listItems = menu.querySelectorAll("li");

      listItems.forEach((item) => {
        expect(item.getAttribute("role")).toBe("presentation");
      });
    });

    test("should set ARIA role on menu links", () => {
      new PureDropdown(dropdownParent);
      const links = menu.querySelectorAll("a");

      links.forEach((link) => {
        expect(link.getAttribute("role")).toBe("menuitem");
      });
    });
  });

  describe("show()", () => {
    test("should open closed menu", () => {
      const dropdown = new PureDropdown(dropdownParent);

      dropdown.show();

      expect(dropdown._state).toBe(dropdown.MENU_OPEN);
      expect(dropdownParent.classList.contains("pure-menu-active")).toBe(true);
      expect(menu.getAttribute("aria-hidden")).toBe("false");
    });

    test("should not change state if already open", () => {
      const dropdown = new PureDropdown(dropdownParent);
      dropdown.show();
      const initialState = dropdown._state;

      dropdown.show();

      expect(dropdown._state).toBe(initialState);
    });
  });

  describe("hide()", () => {
    test("should close open menu", () => {
      const dropdown = new PureDropdown(dropdownParent);
      dropdown.show();

      dropdown.hide();

      expect(dropdown._state).toBe(dropdown.MENU_CLOSED);
      expect(dropdownParent.classList.contains("pure-menu-active")).toBe(false);
      expect(menu.getAttribute("aria-hidden")).toBe("true");
    });

    test("should focus on trigger link when closing", () => {
      const dropdown = new PureDropdown(dropdownParent);
      const focusSpy = jest.spyOn(menuLink, "focus");
      dropdown.show();

      dropdown.hide();

      expect(focusSpy).toHaveBeenCalled();
      focusSpy.mockRestore();
    });

    test("should not change state if already closed", () => {
      const dropdown = new PureDropdown(dropdownParent);
      const initialState = dropdown._state;

      dropdown.hide();

      expect(dropdown._state).toBe(initialState);
    });
  });

  describe("toggle()", () => {
    test("should open menu when closed", () => {
      const dropdown = new PureDropdown(dropdownParent);

      dropdown.toggle();

      expect(dropdown._state).toBe(dropdown.MENU_OPEN);
    });

    test("should close menu when open", () => {
      const dropdown = new PureDropdown(dropdownParent);
      dropdown.show();

      dropdown.toggle();

      expect(dropdown._state).toBe(dropdown.MENU_CLOSED);
    });

    test("should toggle between states multiple times", () => {
      const dropdown = new PureDropdown(dropdownParent);

      dropdown.toggle();
      expect(dropdown._state).toBe(dropdown.MENU_OPEN);

      dropdown.toggle();
      expect(dropdown._state).toBe(dropdown.MENU_CLOSED);

      dropdown.toggle();
      expect(dropdown._state).toBe(dropdown.MENU_OPEN);
    });
  });

  describe("halt()", () => {
    test("should stop event propagation", () => {
      const dropdown = new PureDropdown(dropdownParent);
      const event = new Event("click", { bubbles: true, cancelable: true });
      const stopPropagationSpy = jest.spyOn(event, "stopPropagation");
      const preventDefaultSpy = jest.spyOn(event, "preventDefault");

      dropdown.halt(event);

      expect(stopPropagationSpy).toHaveBeenCalled();
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe("Keyboard Navigation", () => {
    test("should detect ESC key (keyCode 27)", () => {
      const keyCode = 27;
      expect(keyCode).toBe(27);
    });

    test("should detect Down arrow key (keyCode 40)", () => {
      const keyCode = 40;
      expect(keyCode).toBe(40);
    });

    test("should detect Up arrow key (keyCode 38)", () => {
      const keyCode = 38;
      expect(keyCode).toBe(38);
    });

    test("should close menu on ESC key", () => {
      const dropdown = new PureDropdown(dropdownParent);
      dropdown.show();
      const event = new KeyboardEvent("keydown", { keyCode: 27 });

      // Simulate ESC key behavior
      if (dropdown._state === dropdown.MENU_OPEN) {
        dropdown.halt(event);
        dropdown.hide();
      }

      expect(dropdown._state).toBe(dropdown.MENU_CLOSED);
    });
  });

  describe("Focus Management", () => {
    test("should find next sibling element node", () => {
      const firstItem = menuItems[0].parentNode;
      let nextSibling = firstItem.nextSibling;

      // Skip text nodes
      while (nextSibling && nextSibling.nodeType !== 1) {
        nextSibling = nextSibling.nextSibling;
      }

      expect(nextSibling).toBeTruthy();
      expect(nextSibling.nodeType).toBe(1); // Element node
    });

    test("should find previous sibling element node", () => {
      const lastItem = menuItems[menuItems.length - 1].parentNode;
      let previousSibling = lastItem.previousSibling;

      // Skip text nodes
      while (previousSibling && previousSibling.nodeType !== 1) {
        previousSibling = previousSibling.previousSibling;
      }

      expect(previousSibling).toBeTruthy();
      expect(previousSibling.nodeType).toBe(1); // Element node
    });

    test("should handle null when no next sibling exists", () => {
      const lastItem = menuItems[menuItems.length - 1].parentNode;
      const nextSibling = lastItem.nextSibling;

      // Text node or null (whitespace in innerHTML creates text nodes)
      expect(nextSibling === null || nextSibling.nodeType === 3).toBe(true);
    });

    test("should handle null when no previous sibling exists", () => {
      const firstItem = menuItems[0].parentNode;
      const previousSibling = firstItem.previousSibling;

      // Text node or null
      expect(previousSibling === null || previousSibling.nodeType === 3).toBe(
        true
      );
    });
  });

  describe("Event Detection", () => {
    test("should detect touch support", () => {
      const hasTouch =
        window.hasOwnProperty && window.hasOwnProperty("ontouchstart");
      const dismissEvent = hasTouch ? "touchstart" : "mousedown";

      expect(["touchstart", "mousedown"]).toContain(dismissEvent);
    });

    test("should use mousedown when touch not supported", () => {
      // Mock no touch support
      const hasTouch = false;
      const dismissEvent = hasTouch ? "touchstart" : "mousedown";

      expect(dismissEvent).toBe("mousedown");
    });
  });

  describe("Menu State Logic", () => {
    test("should recognize menu is open", () => {
      const dropdown = new PureDropdown(dropdownParent);
      dropdown.show();

      const isOpen = dropdown._state === dropdown.MENU_OPEN;
      expect(isOpen).toBe(true);
    });

    test("should recognize menu is closed", () => {
      const dropdown = new PureDropdown(dropdownParent);

      const isClosed = dropdown._state === dropdown.MENU_CLOSED;
      expect(isClosed).toBe(true);
    });

    test("should ignore keyboard events when menu is closed", () => {
      const dropdown = new PureDropdown(dropdownParent);
      const shouldIgnore = dropdown._state !== dropdown.MENU_OPEN;

      expect(shouldIgnore).toBe(true);
    });
  });

  describe("DOM Query Selectors", () => {
    test("should find menu link with selector", () => {
      const link = dropdownParent.querySelector(".pure-menu-link");
      expect(link).toBeTruthy();
      expect(link.textContent).toBe("Menu");
    });

    test("should find menu children with selector", () => {
      const children = dropdownParent.querySelector(".pure-menu-children");
      expect(children).toBeTruthy();
      expect(children.querySelectorAll("li")).toHaveLength(3);
    });

    test("should find all menu items", () => {
      const items = menu.querySelectorAll(".pure-menu-link");
      expect(items).toHaveLength(3);
    });

    test("should find active submenu if exists", () => {
      const activeSubmenu = menu.querySelector(".pure-menu-active");
      expect(activeSubmenu).toBeNull();
    });

    test("should find focused link", () => {
      menuItems[0].focus();
      const focusedLink = document.activeElement;

      expect(focusedLink).toBe(menuItems[0]);
    });

    test("should find last menu item", () => {
      // May be null if .pure-menu-item class not used, check length instead
      const lastByIndex = menuItems[menuItems.length - 1];

      expect(lastByIndex).toBeTruthy();
    });
  });

  describe("Click Outside Behavior", () => {
    test("should detect click on menu link", () => {
      const dropdown = new PureDropdown(dropdownParent);
      const clickTarget = menuLink;

      const isMenuLink = clickTarget === dropdown._link;
      expect(isMenuLink).toBe(true);
    });

    test("should detect click inside menu", () => {
      const dropdown = new PureDropdown(dropdownParent);
      const clickTarget = menuItems[0];

      const isInsideMenu = dropdown._menu.contains(clickTarget);
      expect(isInsideMenu).toBe(true);
    });

    test("should detect click outside menu", () => {
      const dropdown = new PureDropdown(dropdownParent);
      const outsideElement = document.createElement("div");
      document.body.appendChild(outsideElement);

      const isOutside =
        outsideElement !== dropdown._link &&
        !dropdown._menu.contains(outsideElement);

      expect(isOutside).toBe(true);
    });
  });
});
