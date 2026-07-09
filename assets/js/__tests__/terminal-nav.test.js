/**
 * Terminal in-place navigation (terminal-nav.js): the typed-cd SPA swap.
 * Drives window.TerminalNav.go() against fetched-HTML fixtures and asserts the
 * swap / skip / head-patch / cwd logic. The darkmode.js side (routing a
 * `navigate` action here vs falling back to a full reload) stays covered by
 * terminal-commands.test.js.
 */
describe("terminal in-place navigation", () => {
  function loadModule() {
    jest.isolateModules(() => {
      require("../terminal-nav.js");
    });
  }

  // A fetched HTML document. `opts.exempt` marks it terminal-exempt; `opts.pageCss`
  // gives it a page-specific stylesheet (the special-page signal); `opts.main`
  // overrides the #main body; `opts.noMain` drops #main entirely.
  function pageHtml(opts) {
    opts = opts || {};
    var head =
      "<title>" +
      (opts.title || "Writing · Site") +
      "</title>" +
      '<meta name="description" content="' +
      (opts.description || "posts") +
      '">' +
      '<link rel="canonical" href="https://tor-bjorn.com' +
      (opts.path || "/writing/") +
      '">';
    if (opts.pageCss) {
      head += '<link rel="stylesheet" href="/css/pages/contact.abc.css">';
    }
    var body = opts.noMain
      ? "<div>no main here</div>"
      : '<main id="main" tabindex="-1">' +
        (opts.main ||
          '<div class="content"><article class="article-card">' +
            '<a href="/writing/a/">Post A</a></article></div>') +
        "</main>";
    return (
      '<!doctype html><html lang="en"' +
      (opts.exempt ? ' data-terminal-exempt="true"' : "") +
      "><head>" +
      head +
      "</head><body>" +
      body +
      "</body></html>"
    );
  }

  function mockFetch(html, resInit) {
    resInit = resInit || {};
    window.fetch = jest.fn(function () {
      if (resInit.reject) {
        return Promise.reject(new Error("network"));
      }
      return Promise.resolve({
        ok: resInit.ok !== false,
        redirected: !!resInit.redirected,
        url: resInit.url || "/writing/",
        text: function () {
          return Promise.resolve(html);
        },
      });
    });
  }

  function cwdVar() {
    return document.documentElement.style.getPropertyValue("--terminal-cwd");
  }

  beforeEach(() => {
    document.documentElement.setAttribute("data-layout", "terminal");
    document.documentElement.setAttribute("lang", "en");
    document.documentElement.style.removeProperty("--terminal-cwd");
    document.documentElement.innerHTML =
      "<head><title>Home · Site</title>" +
      '<meta name="description" content="home">' +
      '<link rel="canonical" href="https://tor-bjorn.com/">' +
      "</head><body>" +
      '<main id="main" tabindex="-1"><div class="content">HOME</div></main>' +
      '<footer><div class="terminal-session"></div>' +
      '<p class="terminal-tail"><input data-js="terminal-input" /></p></footer>' +
      "</body>";

    window.scrollTo = jest.fn();
    window.requestAnimationFrame = jest.fn((cb) => cb());
    window.TerminalLightbox = { refresh: jest.fn() };
    // jsdom leaves history at "/"; pushState still records calls we assert on.
    jest.spyOn(window.history, "pushState");
  });

  test("go() swaps #main, patches the title + cwd, and pushes state", async () => {
    mockFetch(pageHtml());
    loadModule();

    const swapped = await window.TerminalNav.go("/writing/", {
      cwd: "~/writing",
    });

    expect(swapped).toBe(true);
    expect(document.querySelector("#main .article-card")).not.toBeNull();
    expect(document.querySelector("#main").textContent).not.toContain("HOME");
    expect(document.title).toBe("Writing · Site");
    expect(cwdVar()).toBe('"~/writing"');
    expect(window.history.pushState).toHaveBeenCalledWith(
      { terminalNav: true },
      "",
      "/writing/"
    );
  });

  test("go() drops the boot theater so the swapped #main isn't held at opacity 0", async () => {
    // The boot animation (.terminal-booting #main { animation: terminal-print
    // both }) pins a freshly swapped #main at opacity 0 through its delay, so a
    // swap mid-boot must clear the class and mark the session booted.
    mockFetch(pageHtml());
    loadModule();
    document.documentElement.classList.add("terminal-booting");

    await window.TerminalNav.go("/writing/", { cwd: "~/writing" });

    expect(
      document.documentElement.classList.contains("terminal-booting")
    ).toBe(false);
    expect(document.documentElement.getAttribute("data-terminal-booted")).toBe(
      "1"
    );
  });

  test("go() patches SEO meta from the fetched head", async () => {
    mockFetch(pageHtml({ description: "all my posts" }));
    loadModule();

    await window.TerminalNav.go("/writing/", { cwd: "~/writing" });

    const desc = document.head.querySelector('meta[name="description"]');
    expect(desc.getAttribute("content")).toBe("all my posts");
    const canonical = document.head.querySelector('link[rel="canonical"]');
    expect(canonical.getAttribute("href")).toBe(
      "https://tor-bjorn.com/writing/"
    );
  });

  test("go() re-runs lightbox figure focusability after the swap", async () => {
    mockFetch(pageHtml());
    loadModule();

    await window.TerminalNav.go("/writing/", { cwd: "~/writing" });

    expect(window.TerminalLightbox.refresh).toHaveBeenCalled();
  });

  test("go() declines a terminal-exempt page (full-reload fallback)", async () => {
    mockFetch(pageHtml({ exempt: true }));
    loadModule();

    const swapped = await window.TerminalNav.go("/ui-library/", {
      cwd: "~/ui-library",
    });

    expect(swapped).toBe(false);
    expect(document.querySelector("#main").textContent).toContain("HOME");
    expect(window.history.pushState).not.toHaveBeenCalled();
  });

  test("go() declines a CSS-bundled special page", async () => {
    mockFetch(pageHtml({ pageCss: true }));
    loadModule();

    const swapped = await window.TerminalNav.go("/contact/", {
      cwd: "~/contact",
    });

    expect(swapped).toBe(false);
    expect(document.querySelector("#main").textContent).toContain("HOME");
  });

  test("go() declines a document without #main", async () => {
    mockFetch(pageHtml({ noMain: true }));
    loadModule();

    const swapped = await window.TerminalNav.go("/weird/", { cwd: "~/weird" });

    expect(swapped).toBe(false);
    expect(document.querySelector("#main").textContent).toContain("HOME");
  });

  test("go() falls back on a non-OK response and on a network error", async () => {
    mockFetch(pageHtml(), { ok: false });
    loadModule();
    expect(await window.TerminalNav.go("/writing/", { cwd: "~/writing" })).toBe(
      false
    );

    mockFetch(pageHtml(), { reject: true });
    loadModule();
    expect(await window.TerminalNav.go("/writing/", { cwd: "~/writing" })).toBe(
      false
    );
  });

  test("go() declines a redirect that leaves the origin", async () => {
    mockFetch(pageHtml(), {
      redirected: true,
      url: "https://evil.example.com/writing/",
    });
    loadModule();

    const swapped = await window.TerminalNav.go("/writing/", {
      cwd: "~/writing",
    });

    expect(swapped).toBe(false);
  });

  test("go() derives the cwd from the URL when none is passed", async () => {
    mockFetch(pageHtml({ path: "/works/" }));
    loadModule();

    await window.TerminalNav.go("/works/");

    expect(cwdVar()).toBe('"~/works"');
  });
});
