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
        <button data-js="terminal-exit">[exit]</button>
        <div class="top-menu__container">
          <span class="terminal-prompt terminal-prompt--nav"
            ><span class="terminal-prompt__cmd">ls nav/</span></span
          >
          <nav class="top-menu__nav">
            <a class="terminal-prompt__host" href="/"></a>
            <a class="top-menu__link" href="/writing/">Writing</a>
            <a class="top-menu__link" href="/about/">About</a>
          </nav>
        </div>
        <div data-js="coty-transport" hidden>
          <button data-js="coty-transport-trigger" aria-label="Show"></button>
          <button
            data-js="coty-transport-toggle"
            data-label-play="Play"
            data-label-pause="Pause"
            aria-label="Play"
          ><svg data-js="coty-play-icon"></svg></button>
        </div>
        <form class="footer-newsletter__form" action="https://example.test/subscribe" method="post" data-mc-form novalidate>
          <input type="email" name="EMAIL" />
          <input type="hidden" name="locale" value="en" />
        </form>
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
    expect(sessionText()).toContain("commands:");
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

  test("exit wipes the command scrollback (no leak into other layouts)", () => {
    localStorage.setItem("theme-layout-previous", "column");
    loadModule();
    typeCommand("whoami");
    expect(sessionText().length).toBeGreaterThan(0);
    typeCommand("exit");
    expect(sessionText()).toBe("");
  });

  // ---- Interactive flows (contact / subscribe) --------------------------

  const flush = async () => {
    for (let i = 0; i < 6; i++) {
      await Promise.resolve();
    }
  };

  function tailPrompt() {
    return document
      .querySelector(".terminal-tail")
      .getAttribute("data-flow-label");
  }

  test("contact walks through prompts and POSTs to the Netlify form", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    window.fetch = fetchMock;

    loadModule();
    typeCommand("contact");
    // The prompt switches to the first field.
    expect(tailPrompt()).toBe("email>");
    expect(sessionText()).toContain("contact —");

    typeCommand("me@example.com");
    expect(tailPrompt()).toBe("name>");
    typeCommand("Ada");
    expect(tailPrompt()).toBe("message>");
    typeCommand("hello there");
    // Now at the confirmation step.
    expect(tailPrompt()).toBe("send this? [Y/n]");

    typeCommand("y");
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("/");
    expect(opts.body).toContain("form-name=contact");
    expect(opts.body).toContain("email=me%40example.com");
    expect(opts.body).toContain("name=Ada");
    expect(sessionText().toLowerCase()).toContain("message sent");
    // Flow ended: prompt restored.
    expect(tailPrompt()).toBeNull();
  });

  test("contact re-prompts on an invalid email", () => {
    loadModule();
    typeCommand("contact");
    typeCommand("not-an-email");
    // Still on the email step, with an error printed.
    expect(tailPrompt()).toBe("email>");
    expect(sessionText().toLowerCase()).toContain("email");
  });

  test("cancel aborts a flow", () => {
    loadModule();
    typeCommand("contact");
    typeCommand("cancel");
    expect(tailPrompt()).toBeNull();
    expect(sessionText()).toContain("^C");
  });

  test("exit during a flow resets it (no stale flow on re-entry)", () => {
    localStorage.setItem("theme-layout-previous", "column");
    loadModule();
    typeCommand("contact");
    expect(tailPrompt()).toBe("email>");
    // Leaving via the [exit] button (typing "exit" mid-flow would be flow
    // input, not the command) must clear the flow state + label.
    document.querySelector('[data-js="terminal-exit"]').click();
    expect(document.documentElement.getAttribute("data-layout")).not.toBe(
      "terminal"
    );
    expect(tailPrompt()).toBeNull();
  });

  test("Escape aborting a flow clears the half-typed input", () => {
    loadModule();
    typeCommand("contact");
    const input = document.querySelector('[data-js="terminal-input"]');
    input.value = "hello";
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
    input.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
    expect(tailPrompt()).toBeNull(); // flow aborted
    expect(input.value).toBe(""); // stale text cleared
  });

  test("pantone <year> activates and sets that year", () => {
    loadModule();
    typeCommand("pantone 2026");
    expect(sessionText()).toContain("year → 2026");
    expect(document.documentElement.getAttribute("data-palette")).toBe(
      "pantone"
    );
    expect(window.CotyScaleActions.setYear).toHaveBeenCalled();
  });

  test("pantone rejects a year that isn't available", () => {
    loadModule();
    typeCommand("pantone 1999");
    expect(sessionText()).toContain("no year 1999");
    // No activation on a rejected year.
    expect(document.documentElement.getAttribute("data-palette")).not.toBe(
      "pantone"
    );
  });

  test("an unknown pantone option reports usage without toggling", () => {
    loadModule();
    typeCommand("pantone on");
    expect(document.documentElement.getAttribute("data-palette")).toBe(
      "pantone"
    );
    typeCommand("pantone wat");
    expect(sessionText()).toContain("unknown option 'wat'");
    // Still active — an unknown option must not toggle Pantone off.
    expect(document.documentElement.getAttribute("data-palette")).toBe(
      "pantone"
    );
  });

  test("pantone next advances the year and activates", () => {
    loadModule();
    typeCommand("pantone next");
    expect(sessionText()).toContain("next year");
    expect(document.documentElement.getAttribute("data-palette")).toBe(
      "pantone"
    );
  });

  test("grain on / off / toggle drives the grain effect", () => {
    loadModule();
    typeCommand("grain on");
    expect(document.documentElement.getAttribute("data-effect-grain")).toBe(
      "on"
    );
    typeCommand("grain off");
    expect(document.documentElement.getAttribute("data-effect-grain")).toBe(
      "off"
    );
    typeCommand("grain");
    expect(document.documentElement.getAttribute("data-effect-grain")).toBe(
      "on"
    );
  });

  test("blend responds to on/off", () => {
    loadModule();
    typeCommand("blend on");
    expect(document.documentElement.getAttribute("data-effect-blend")).toBe(
      "on"
    );
    typeCommand("blend off");
    expect(document.documentElement.getAttribute("data-effect-blend")).toBe(
      "off"
    );
  });

  test("motion on means animation ON (reduced-motion off), and vice versa", () => {
    loadModule();
    // "motion on" = motion enabled = reduced-motion OFF (inverse of the attr).
    typeCommand("motion on");
    expect(
      document.documentElement.getAttribute("data-effect-reduced-motion")
    ).toBe("off");
    typeCommand("motion off");
    expect(
      document.documentElement.getAttribute("data-effect-reduced-motion")
    ).toBe("on");
  });

  test("cd rejects unknown pages and resolves known ones", () => {
    // jsdom's window.location is non-configurable, so the navigation side
    // effect isn't observable here — assert the resolution logic instead: an
    // unknown page errors, a known nav page does not (it produces a navigate
    // action, exercised for real in the browser check).
    loadModule();
    typeCommand("cd nope");
    expect(sessionText()).toContain("no such file or directory: nope");

    const before = sessionText();
    typeCommand("cd writing");
    // No new error line for a page that exists in the nav.
    expect(sessionText().slice(before.length)).not.toContain(
      "no such file or directory"
    );
  });

  test("subscribe reuses the newsletter form action", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    window.fetch = fetchMock;

    loadModule();
    typeCommand("subscribe");
    expect(tailPrompt()).toBe("email>");
    typeCommand("me@example.com");
    expect(tailPrompt()).toBe("subscribe with this address? [Y/n]");
    typeCommand("y");
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("https://example.test/subscribe");
    expect(opts.body).toContain("EMAIL=me%40example.com");
    expect(sessionText().toLowerCase()).toContain("subscribed");
  });

  // ---- Nav "cd" feedback ------------------------------------------------

  test("clicking a nav link stashes a cd command for the next page", () => {
    loadModule();
    sessionStorage.removeItem("terminal-cd");
    document.querySelector('.top-menu__link[href="/writing/"]').click();
    const stashed = JSON.parse(sessionStorage.getItem("terminal-cd"));
    expect(stashed.cmd).toBe("cd ~/writing");
  });

  test("a pending cd prints as scrollback above the page's first prompt", () => {
    sessionStorage.setItem(
      "terminal-cd",
      JSON.stringify({ from: "~/writing", cmd: "cd ~/about" })
    );
    loadModule();
    const container = document.querySelector(".top-menu__container");
    const first = container.querySelector(":scope > .terminal-prompt");
    // The injected echo is the container's first prompt, before the nav prompt.
    expect(first.classList.contains("terminal-prompt--cd")).toBe(true);
    expect(first.querySelector(".terminal-prompt__cmd").textContent).toBe(
      "cd ~/about"
    );
    // Its cwd is overridden to where we came from.
    expect(first.style.getPropertyValue("--terminal-cwd")).toContain(
      "~/writing"
    );
    // Consumed — not shown again on a plain reload.
    expect(sessionStorage.getItem("terminal-cd")).toBeNull();
  });

  test("subscribe reports a server error instead of parsing non-OK JSON", async () => {
    // Non-OK response with an HTML body — response.json() would reject; the
    // guard must report a server error, not the generic "offline".
    window.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("not json")),
    });

    loadModule();
    typeCommand("subscribe");
    typeCommand("me@example.com");
    typeCommand("y");
    await flush();

    expect(sessionText().toLowerCase()).toContain("server rejected");
    expect(sessionText().toLowerCase()).not.toContain("offline");
  });
});
