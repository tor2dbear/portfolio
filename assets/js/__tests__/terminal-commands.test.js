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
        <div class="language-list">
          <label class="language-option"
            ><input data-language-code="en" data-language-name="English" checked
          /></label>
          <label class="language-option"
            ><input
              data-language-code="sv"
              data-language-name="Svenska"
              data-language-href="/sv/"
          /></label>
        </div>
        <div class="top-menu__container">
          <span class="terminal-prompt terminal-prompt--nav"
            ><span class="terminal-prompt__cmd">ls nav/</span></span
          >
          <nav class="top-menu__nav">
            <a class="terminal-prompt__host" href="/"></a>
            <a class="top-menu__link" href="/works/">Works</a>
            <a class="top-menu__link" href="/works/tags/">Tags</a>
            <a class="top-menu__link" href="/writing/">Writing</a>
            <a class="top-menu__link" href="/about/">About</a>
            <a class="terminal-quick terminal-quick--lang" href="/sv/writing/" lang="sv">sv</a>
          </nav>
        </div>
        <div class="article-card"><a href="/writing/the-grid-inherited/">The grid</a></div>
        <footer>
          <nav class="footer-nav">
            <a href="/ui-library/">UI Library</a>
            <a href="/palette-generator/">Palette</a>
          </nav>
          <address class="footer-contact">
            <ul class="footer-menu">
              <li><a href="mailto:hej@tor-bjorn.com">hej@tor-bjorn.com</a></li>
              <li><a href="https://www.linkedin.com/in/tbhedberg/">LinkedIn</a></li>
            </ul>
          </address>
        </footer>
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
      getPropertyValue: jest.fn((prop) =>
        prop === "--terminal-cwd" ? "~" : "#ffffff"
      ),
    }));
    window.Toast = { show: jest.fn() };
    window.requestAnimationFrame = jest.fn();
    window.scrollTo = jest.fn();
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: {
        load: jest.fn(() => Promise.resolve()),
        ready: Promise.resolve(),
        check: jest.fn(() => true),
      },
    });
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

  // ---- Additional commands & easter eggs --------------------------------

  test("ls lists the nav pages as directories", () => {
    loadModule();
    typeCommand("ls");
    expect(sessionText()).toContain("writing/");
    expect(sessionText()).toContain("about/");
  });

  test("cat prints a known pseudo-file and 404s unknown ones", () => {
    loadModule();
    typeCommand("cat readme");
    expect(sessionText().toLowerCase()).toContain("portfolio");
    typeCommand("cat nope");
    expect(sessionText()).toContain("No such file or directory");
  });

  test("cat strips a leading dot and extension", () => {
    loadModule();
    typeCommand("cat .secret");
    expect(sessionText().toLowerCase()).toContain("no secrets");
  });

  test("man pulls a one-line description from help", () => {
    loadModule();
    typeCommand("man whoami");
    expect(sessionText()).toContain("who's asking");
    typeCommand("man nope");
    expect(sessionText()).toContain("No manual entry for nope");
  });

  test("uname -a reports the session, plain uname the shell", () => {
    loadModule();
    typeCommand("uname");
    expect(sessionText()).toContain("tor-sh");
    typeCommand("uname -a");
    expect(sessionText()).toContain("terminal");
  });

  test("colour prints the active palette swatches", () => {
    loadModule();
    typeCommand("colour");
    expect(sessionText().toLowerCase()).toContain("paper");
    expect(sessionText()).toContain("#ffffff");
  });

  test("fortune prints one of the aphorisms", () => {
    loadModule();
    typeCommand("fortune");
    // Every fortune carries an em-dash attribution.
    expect(sessionText()).toContain("—");
  });

  test("history records commands, newest last, including itself", () => {
    loadModule();
    typeCommand("whoami");
    typeCommand("date");
    typeCommand("history");
    const text = sessionText();
    expect(text).toContain("1  whoami");
    expect(text).toContain("2  date");
    expect(text).toContain("3  history");
  });

  test("uptime reports an 'up' line", () => {
    loadModule();
    typeCommand("uptime");
    expect(sessionText()).toContain("up ");
  });

  test("top prints a tongue-in-cheek process list", () => {
    loadModule();
    typeCommand("top");
    expect(sessionText()).toContain("tor-sh");
    expect(sessionText().toLowerCase()).toContain("coffee");
  });

  test("editor jokes point back at exit", () => {
    loadModule();
    typeCommand("vim");
    expect(sessionText().toLowerCase()).toContain("exit");
  });

  test(":wq leaves the terminal like exit", () => {
    localStorage.setItem("theme-layout-previous", "column");
    loadModule();
    typeCommand(":wq");
    expect(document.documentElement.getAttribute("data-layout")).not.toBe(
      "terminal"
    );
  });

  test("rm -rf / refuses with the git joke", () => {
    loadModule();
    typeCommand("rm -rf /");
    expect(sessionText().toLowerCase()).toContain("it's all in git");
  });

  test("git subcommands answer in character", () => {
    loadModule();
    typeCommand("git blame");
    expect(sessionText().toLowerCase()).toContain("you");
    typeCommand("git commit");
    expect(sessionText().toLowerCase()).toContain("working tree clean");
  });

  test("npm install fakes a dependency resolve, then reveals the joke", () => {
    loadModule();
    typeCommand("npm install");
    // The "working" line lands immediately; the punchline is held back.
    expect(sessionText().toLowerCase()).toContain("resolving 4271");
    expect(sessionText().toLowerCase()).not.toContain("vanilla js");
    jest.advanceTimersByTime(1000);
    expect(sessionText().toLowerCase()).toContain("vanilla js");
  });

  test("hello greets back", () => {
    loadModule();
    typeCommand("hello");
    expect(sessionText()).toContain("hey");
  });

  test("easteregg lists the hidden commands but stays out of help", () => {
    loadModule();
    typeCommand("easteregg");
    const eggs = sessionText();
    expect(eggs).toContain("easter eggs:");
    expect(eggs).toContain("konami");
    expect(eggs).toContain("fortune");
    typeCommand("clear");
    typeCommand("help");
    const help = sessionText();
    expect(help).toContain("commands:");
    // The index itself is not advertised in help.
    expect(help).not.toContain("easter eggs:");
    expect(help).not.toContain("konami");
  });

  // ---- Round 4: directory tree, utilities, fundamentals -----------------

  function keydown(opts) {
    document
      .querySelector('[data-js="terminal-input"]')
      .dispatchEvent(
        new window.KeyboardEvent("keydown", { bubbles: true, ...opts })
      );
  }

  test("ls lists the current directory's sections", () => {
    loadModule();
    typeCommand("ls");
    expect(sessionText()).toContain("works/");
    expect(sessionText()).toContain("writing/");
  });

  test("ls <path> lists that directory; unknown paths error", () => {
    loadModule();
    typeCommand("ls works");
    expect(sessionText()).toContain("tags/");
    typeCommand("ls nope");
    expect(sessionText()).toContain(
      "cannot access 'nope': No such file or directory"
    );
  });

  test("ls -a reveals hidden entries", () => {
    loadModule();
    typeCommand("ls -a");
    expect(sessionText()).toContain(".secret");
    expect(sessionText()).toContain(".config");
  });

  test("ls inside a section lists the page's own content links", () => {
    loadModule();
    // Pretend the page is /writing/ so the cwd is ~/writing.
    window.getComputedStyle = jest.fn(() => ({
      getPropertyValue: jest.fn((prop) =>
        prop === "--terminal-cwd" ? "~/writing" : "#ffffff"
      ),
    }));
    typeCommand("ls");
    // Posts are files, not directories: listed as .md (no trailing slash).
    expect(sessionText()).toContain("the-grid-inherited.md");
    expect(sessionText()).not.toContain("the-grid-inherited/");
  });

  test("ls of another section hints at cd instead of printing nothing", () => {
    loadModule();
    // Sitting on /works/, ask for a different section's contents.
    window.getComputedStyle = jest.fn(() => ({
      getPropertyValue: jest.fn((prop) =>
        prop === "--terminal-cwd" ? "~/works" : "#ffffff"
      ),
    }));
    typeCommand("ls ~/writing");
    expect(sessionText()).toContain("cd writing");
  });

  test("ls lists several paths with per-directory headers", () => {
    loadModule();
    typeCommand("ls works writing");
    const text = sessionText();
    expect(text).toContain("works:");
    expect(text).toContain("writing:");
    expect(text).toContain("tags/");
  });

  test("tree draws the site map", () => {
    loadModule();
    typeCommand("tree");
    const text = sessionText();
    expect(text).toContain("works/");
    expect(text).toContain("tags/");
    expect(text).toMatch(/[├└]/);
  });

  test("hire starts the contact flow", () => {
    loadModule();
    typeCommand("hire");
    expect(tailPrompt()).toBe("email>");
  });

  test("social lists the real footer links", () => {
    loadModule();
    typeCommand("social");
    const text = sessionText();
    expect(text).toContain("hej@tor-bjorn.com");
    expect(text.toLowerCase()).toContain("linkedin");
  });

  test("email prints the contact address", () => {
    loadModule();
    typeCommand("email");
    expect(sessionText()).toContain("hej@tor-bjorn.com");
  });

  test("resume heads to the about page", () => {
    loadModule();
    typeCommand("resume");
    expect(sessionText().toLowerCase()).toContain("about");
  });

  test("layout switches the layout and lists options with no arg", () => {
    loadModule();
    typeCommand("layout");
    expect(sessionText()).toContain("available:");
    typeCommand("layout editorial");
    expect(document.documentElement.getAttribute("data-layout")).toBe(
      "editorial"
    );
  });

  test("debug prints the theme state", () => {
    loadModule();
    typeCommand("debug");
    const text = sessionText();
    expect(text).toContain("layout");
    expect(text).toContain("palette");
  });

  test("reset restores theme defaults", () => {
    localStorage.setItem("theme-mode", "dark");
    localStorage.setItem("theme-palette", "custom");
    loadModule();
    typeCommand("reset");
    expect(sessionText()).toContain("reset:");
    expect(localStorage.getItem("theme-mode")).toBe("system");
    expect(localStorage.getItem("theme-palette")).toBe("standard");
  });

  test("copy writes to the clipboard and confirms", () => {
    const writeText = jest.fn();
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    loadModule();
    typeCommand("copy email");
    expect(sessionText()).toContain("copied:");
    expect(writeText).toHaveBeenCalledWith("hej@tor-bjorn.com");
  });

  test("classic eggs respond", () => {
    loadModule();
    typeCommand("xyzzy");
    expect(sessionText()).toContain("Nothing happens.");
    typeCommand("42");
    expect(sessionText()).toContain("42");
    typeCommand("ping");
    expect(sessionText().toLowerCase()).toContain("pong");
    typeCommand("sl");
    expect(sessionText().toLowerCase()).toContain("choo");
  });

  test("cowsay speaks the argument", () => {
    loadModule();
    typeCommand("cowsay hello");
    const text = sessionText();
    expect(text).toContain("hello");
    expect(text).toContain("^__^");
  });

  test("logo prints the boot art", () => {
    loadModule();
    typeCommand("logo");
    expect(sessionText()).toContain("██");
  });

  test("weather prints a fake forecast", () => {
    loadModule();
    typeCommand("weather");
    expect(sessionText().toLowerCase()).toContain("breeze");
  });

  test("matrix rains, then wakes up", () => {
    loadModule();
    typeCommand("matrix");
    jest.advanceTimersByTime(1500);
    expect(sessionText()).toContain("wake up");
  });

  test("sudo make me a sandwich vs make me a sandwich", () => {
    loadModule();
    typeCommand("sudo make me a sandwich");
    expect(sessionText()).toContain("okay.");
    typeCommand("make me a sandwich");
    expect(sessionText()).toContain("make it yourself");
  });

  test("↑ recalls the previous command", () => {
    loadModule();
    typeCommand("whoami");
    keydown({ key: "ArrowUp" });
    expect(document.querySelector('[data-js="terminal-input"]').value).toBe(
      "whoami"
    );
  });

  test("Tab completes a command name", () => {
    loadModule();
    const input = document.querySelector('[data-js="terminal-input"]');
    input.value = "wea";
    keydown({ key: "Tab" });
    expect(input.value).toBe("weather ");
  });

  test("Tab completes a cd path from the tree", () => {
    loadModule();
    const input = document.querySelector('[data-js="terminal-input"]');
    input.value = "cd wri";
    keydown({ key: "Tab" });
    expect(input.value).toBe("cd writing");
  });

  test("Ctrl+L clears the screen, Ctrl+C cancels the line", () => {
    loadModule();
    const input = document.querySelector('[data-js="terminal-input"]');
    typeCommand("whoami");
    expect(sessionText().length).toBeGreaterThan(0);
    keydown({ key: "l", ctrlKey: true });
    expect(sessionText()).toBe("");
    input.value = "half typed";
    keydown({ key: "c", ctrlKey: true });
    expect(input.value).toBe("");
    expect(sessionText()).toContain("^C");
  });

  test("konami command toggles party mode", async () => {
    loadModule();
    typeCommand("konami");
    expect(document.documentElement.getAttribute("data-konami")).toBe("on");
    // toggleKonami de-dupes a synchronous burst (see darkmode.js), so let the
    // guard clear on the microtask queue before toggling back off.
    await Promise.resolve();
    typeCommand("konami");
    expect(document.documentElement.getAttribute("data-konami")).toBeNull();
  });

  test("the Konami key sequence at the prompt enables party mode", () => {
    loadModule();
    const input = document.querySelector('[data-js="terminal-input"]');
    const press = (key) =>
      input.dispatchEvent(
        new window.KeyboardEvent("keydown", { key, bubbles: true })
      );
    [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "b",
      "a",
    ].forEach(press);
    expect(document.documentElement.getAttribute("data-konami")).toBe("on");
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

  test("a post is a file: cd rejects it, cat opens it", () => {
    // The test DOM has an article-card link to /writing/the-grid-inherited/.
    // Posts are files, so `cd` into one is "not a directory" and points at cat;
    // `cat <post>.md` navigates (its page renders as the cat output).
    loadModule();
    typeCommand("cd writing/the-grid-inherited");
    expect(sessionText()).toContain(
      "not a directory: writing/the-grid-inherited"
    );
    expect(sessionText()).toContain("cat writing/the-grid-inherited.md");

    const before = sessionText();
    typeCommand("cat writing/the-grid-inherited.md");
    // Resolves (produces a navigate action) — no cat error.
    expect(sessionText().slice(before.length)).not.toContain(
      "No such file or directory"
    );

    // A post that isn't on the page still errors.
    typeCommand("cat writing/ghost-post.md");
    expect(sessionText()).toContain(
      "cat: writing/ghost-post.md: No such file or directory"
    );
  });

  test("ls nav/ and ls settings/ list the menus (as the header prints them)", () => {
    loadModule();
    typeCommand("ls nav/");
    expect(sessionText()).toContain("works/"); // a section is a directory
    expect(sessionText()).toContain("about"); // a standalone page is a leaf
    const before = sessionText();
    typeCommand("ls settings/");
    const added = sessionText().slice(before.length);
    expect(added).toContain("theme");
    expect(added).toContain("language");
  });

  test("nav and settings are menus, not places: cd lists instead of entering", () => {
    loadModule();
    typeCommand("cd settings");
    expect(sessionText()).toContain("menu, not a directory");
  });

  test("open navigates to a post file", () => {
    loadModule();
    const before = sessionText();
    typeCommand("open writing/the-grid-inherited.md");
    expect(sessionText().slice(before.length)).not.toContain(
      "no such file or directory"
    );
  });

  test("ls --featured lists the page's cards as files (not misread as -a)", () => {
    loadModule();
    typeCommand("ls works/ --featured");
    // The article-card link → a .md file; the long flag must not trip -a.
    expect(sessionText()).toContain("the-grid-inherited.md");
    expect(sessionText()).not.toContain(".secret");
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

  test("re-entering the terminal un-hides the boot banner", () => {
    // A subsequent page hides the banner via data-terminal-booted; starting the
    // terminal again (a fresh boot) must reveal it.
    document.documentElement.setAttribute("data-terminal-booted", "1");
    loadModule();
    window.ThemeActions.setLayout("column");
    window.ThemeActions.setLayout("terminal");
    expect(document.documentElement.hasAttribute("data-terminal-booted")).toBe(
      false
    );
  });

  // ---- language command -------------------------------------------------

  test("lang lists the current and available languages", () => {
    loadModule();
    typeCommand("lang");
    expect(sessionText()).toContain("language: en");
    expect(sessionText()).toContain("sv");
  });

  test("lang <current> reports it's already active", () => {
    loadModule();
    typeCommand("lang en");
    expect(sessionText().toLowerCase()).toContain("already");
  });

  test("lang rejects an unknown language", () => {
    loadModule();
    typeCommand("lang xx");
    expect(sessionText()).toContain("unknown language 'xx'");
  });

  test("lang sv switches without a spurious cd echo", () => {
    sessionStorage.removeItem("terminal-cd");
    loadModule();
    typeCommand("lang sv");
    const txt = sessionText().toLowerCase();
    expect(txt).not.toContain("unknown");
    expect(txt).not.toContain("already");
    // A language switch is the same directory — no cd echo may be stashed.
    expect(sessionStorage.getItem("terminal-cd")).toBeNull();
  });

  // ---- Nav "cd" feedback ------------------------------------------------

  test("clicking a nav link stashes a cd command for the next page", () => {
    loadModule();
    sessionStorage.removeItem("terminal-cd");
    document.querySelector('.top-menu__link[href="/writing/"]').click();
    const stashed = JSON.parse(sessionStorage.getItem("terminal-cd"));
    expect(stashed.cmd).toBe("cd ~/writing");
  });

  test("clicking the statusbar language toggle does NOT stash a cd echo", () => {
    loadModule();
    sessionStorage.removeItem("terminal-cd");
    // A language switch changes language, not directory — no `cd` echo, and its
    // /sv/writing/ href must not poison the "writing" cd target either.
    document.querySelector(".terminal-quick--lang").click();
    expect(sessionStorage.getItem("terminal-cd")).toBeNull();
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
