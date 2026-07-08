/**
 * Terminal command line (darkmode.js): the tail <input> that fixes mobile
 * typing and hosts the small command set + easter eggs. Driven the same way as
 * darkmode-pantone.test.js — require the module, fire DOMContentLoaded, then
 * dispatch real events at the input.
 */
describe("terminal command line", () => {
  function setupCotyActions() {
    const entries = [{ year: 2026, name: "Latest" }];
    let currentYear = 2026;
    window.CotyScaleActions = {
      init: jest.fn(),
      applyPreviewForMode: jest.fn(),
      applyForMode: jest.fn(),
      clearRuntime: jest.fn(),
      getEntries: jest.fn(() => entries),
      getCurrentYear: jest.fn(() => currentYear),
      getEntry: jest.fn(
        (year) =>
          entries.find((entry) => Number(entry.year) === Number(year)) || null
      ),
      setYear: jest.fn((year) => {
        currentYear = Number(year);
        return (
          entries.find((entry) => Number(entry.year) === currentYear) || null
        );
      }),
    };
  }

  function loadModule() {
    jest.isolateModules(() => {
      require("../darkmode.js");
    });
    document.dispatchEvent(new window.Event("DOMContentLoaded"));
  }

  function typeCommand(value) {
    const input = document.querySelector('[data-js="terminal-input"]');
    input.value = value;
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
    input.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true })
    );
  }

  function sessionText() {
    return document.querySelector('[data-js="terminal-session"]').textContent;
  }

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    localStorage.clear();
    localStorage.setItem("theme-layout", "terminal");
    document.documentElement.setAttribute("data-layout", "terminal");

    document.documentElement.innerHTML = `
      <head><meta name="theme-color" content="#ffffff"></head>
      <body>
        <div class="terminal-boot">
          <pre class="terminal-boot__art terminal-boot__art--sm">  ██\n ████</pre>
        </div>
        <button data-js="mode-option" data-mode="light"></button>
        <button data-js="mode-option" data-mode="dark"></button>
        <div data-js="settings-panel" hidden>
          <div class="theme-section">
            <button
              data-js="coty-mode-toggle"
              data-label-activate="Activate Pantone"
              data-label-deactivate="Deactivate Pantone"
              aria-label="Activate Pantone"
              aria-pressed="false"
            ></button>
          </div>
        </div>
        <button data-js="grid-toggle" aria-pressed="false"></button>
        <div data-js="coty-transport" hidden>
          <button data-js="coty-transport-trigger" aria-label="Show"></button>
          <button
            data-js="coty-transport-toggle"
            data-label-play="Play"
            data-label-pause="Pause"
            aria-label="Play"
          ><svg data-js="coty-play-icon"></svg></button>
        </div>
        <div class="terminal-session" data-js="terminal-session" aria-live="polite"></div>
        <p class="terminal-tail" data-exit-hint="type exit or press esc">
          <span class="terminal-tail__prompt"></span
          ><span class="terminal-tail__caret"></span
          ><input id="terminal-input" class="terminal-tail__input" data-js="terminal-input" type="text" size="1" />
        </p>
      </body>
    `;

    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    window.getComputedStyle = jest.fn(() => ({
      getPropertyValue: jest.fn(() => "#ffffff"),
    }));
    window.Toast = { show: jest.fn() };
    window.requestAnimationFrame = jest.fn();
    window.scrollTo = jest.fn();
    setupCotyActions();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("the prompt is a real, focusable input (mobile keyboard fix)", () => {
    loadModule();
    const input = document.querySelector('[data-js="terminal-input"]');
    expect(input).not.toBeNull();
    expect(input.tagName).toBe("INPUT");
    // Not hidden from assistive tech / not disabled — tapping it must focus.
    expect(input.getAttribute("aria-hidden")).toBeNull();
    expect(input.disabled).toBe(false);
  });

  test("Enter runs a command, echoes it, and clears the input", () => {
    loadModule();
    typeCommand("help");
    expect(sessionText()).toContain("help");
    expect(sessionText()).toContain("available commands:");
    expect(document.querySelector('[data-js="terminal-input"]').value).toBe("");
  });

  test("dark / light change the colour mode", () => {
    loadModule();
    typeCommand("dark");
    expect(document.documentElement.getAttribute("data-mode")).toBe("dark");
    typeCommand("light");
    expect(document.documentElement.getAttribute("data-mode")).toBe("light");
  });

  test("pantone on activates the colour-of-the-year effect", () => {
    loadModule();
    typeCommand("pantone on");
    expect(document.documentElement.getAttribute("data-palette")).toBe(
      "pantone"
    );
    typeCommand("pantone off");
    expect(document.documentElement.getAttribute("data-palette")).not.toBe(
      "pantone"
    );
  });

  test("grid toggles the grid overlay button", () => {
    loadModule();
    const gridBtn = document.querySelector('[data-js="grid-toggle"]');
    const clickSpy = jest.spyOn(gridBtn, "click");
    typeCommand("grid");
    expect(clickSpy).toHaveBeenCalled();
  });

  test("echo prints its argument", () => {
    loadModule();
    typeCommand("echo hello world");
    expect(sessionText()).toContain("hello world");
  });

  test("sudo refuses with a joke", () => {
    loadModule();
    typeCommand("sudo rm -rf /");
    expect(sessionText().toLowerCase()).toContain("permission denied");
  });

  test("neofetch prints a session summary", () => {
    loadModule();
    typeCommand("neofetch");
    expect(sessionText()).toContain("layout    terminal");
  });

  test("unknown commands report command not found", () => {
    loadModule();
    typeCommand("frobnicate");
    expect(sessionText()).toContain("frobnicate: command not found");
  });

  test("clear empties the session log", () => {
    loadModule();
    typeCommand("whoami");
    expect(sessionText().length).toBeGreaterThan(0);
    typeCommand("clear");
    expect(sessionText()).toBe("");
  });

  test("Pantone controls render inline inside the settings panel (not floating)", () => {
    loadModule();
    const panel = document.querySelector('[data-js="settings-panel"]');
    const transport = document.querySelector('[data-js="coty-transport"]');
    // In the terminal the transport is moved out of its floating home and into
    // the settings panel, right after the Effects section — the core of the
    // "render inline under the settings" change. (Restoring the floating pill on
    // leaving the terminal is exercised in the browser, not here: this harness
    // reloads the module against a shared jsdom window, which accumulates the
    // layout listener and makes a within-suite layout switch unreliable.)
    expect(transport.parentNode).toBe(panel);
    expect(transport.previousElementSibling).toBe(
      document
        .querySelector('[data-js="coty-mode-toggle"]')
        .closest(".theme-section")
    );
  });

  test("exit leaves the terminal layout", () => {
    localStorage.setItem("theme-layout-previous", "column");
    loadModule();
    typeCommand("exit");
    expect(document.documentElement.getAttribute("data-layout")).not.toBe(
      "terminal"
    );
  });
});
