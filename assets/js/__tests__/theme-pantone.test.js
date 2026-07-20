describe("darkmode pantone", () => {
  function setupCotyActions() {
    const entries = [
      { year: 2024, name: "Peach Fuzz" },
      { year: 2025, name: "Future Dusk" },
      { year: 2026, name: "Latest Year" },
    ];
    let currentYear = 2025;

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
        document.documentElement.setAttribute(
          "data-coty-year",
          String(currentYear)
        );
        return (
          entries.find((entry) => Number(entry.year) === currentYear) || null
        );
      }),
    };
  }

  function loadModule() {
    jest.isolateModules(() => {
      // theme-custom-palette.js publishes window.ThemeCustomPalette, which
      // theme.js's custom-palette shims delegate to; load it first (as in prod).
      require("../theme-custom-palette.js");
      require("../theme.js");
      require("../theme-pantone.js");
    });
    document.dispatchEvent(new window.Event("DOMContentLoaded"));
  }

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    localStorage.clear();
    sessionStorage.clear();
    // innerHTML only replaces <head>/<body>; data-* attributes set on <html> by
    // a previous test survive and leak state (palette, pantone-state, coty-year)
    // into the next module load. Strip them so each test starts hermetic.
    Array.from(document.documentElement.attributes).forEach((attr) => {
      document.documentElement.removeAttribute(attr.name);
    });
    document.documentElement.innerHTML = `
      <head>
        <meta name="theme-color" content="#ffffff">
      </head>
      <body>
        <button data-js="theme-toggle" aria-expanded="false">Theme</button>
        <div data-js="theme-panel" hidden></div>
        <div data-js="theme-overlay" hidden></div>
        <div data-js="theme-icon"></div>
        <button
          data-js="coty-mode-toggle"
          data-label-activate="Activate Pantone"
          data-label-deactivate="Deactivate Pantone"
          aria-label="Activate Pantone"
          aria-pressed="false"
        >
          Pantone mode
        </button>
        <span
          data-js="footer-palette"
          data-category="Palette"
          data-label-standard="Standard"
          data-label-pantone="Pantone"
          data-toast-icon="icon-grid-micro"
        ></span>
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
    window.Toast = {
      show: jest.fn(),
    };
    setupCotyActions();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("activating pantone mode starts active on the latest year", () => {
    loadModule();

    document.querySelector('[data-js="coty-mode-toggle"]').click();

    expect(document.documentElement.getAttribute("data-palette")).toBe(
      "pantone"
    );
    expect(document.documentElement.getAttribute("data-pantone-state")).toBe(
      "active"
    );
    expect(document.documentElement.getAttribute("data-coty-year")).toBe(
      "2026"
    );
    expect(
      document
        .querySelector('[data-js="coty-mode-toggle"]')
        .getAttribute("aria-pressed")
    ).toBe("true");
  });

  test("activating pantone before CotyScale loads snaps to the latest year once it does", () => {
    // Regression for the lazy-load race: the ~52KB CotyScale engine is loaded
    // on demand. If Pantone is activated before it finishes, getLatestCotyYear()
    // can only see the stored fallback year, not the real entries — so the true
    // latest year has to be re-applied once the engine's script fires "load".
    const lateActions = window.CotyScaleActions;
    delete window.CotyScaleActions; // engine not loaded yet at activation time
    window.__cotyScaleSrc = "coty-scale.js"; // let ensureCotyLoaded inject a script
    localStorage.setItem("theme-coty-year", "2024"); // stale fallback, not latest (2026)

    loadModule();

    document.querySelector('[data-js="coty-mode-toggle"]').click();

    // Only the stale fallback year is known while the engine is still loading.
    expect(document.documentElement.getAttribute("data-palette")).toBe(
      "pantone"
    );
    expect(document.documentElement.getAttribute("data-coty-year")).toBe(
      "2024"
    );

    // Engine finishes loading -> its script fires "load" -> queued callbacks run.
    const script = document.querySelector("script[data-coty-scale]");
    expect(script).not.toBeNull();
    window.CotyScaleActions = lateActions;
    script.dispatchEvent(new window.Event("load"));

    // Activation now corrects to the real latest COTY year, not the stale 2024.
    expect(document.documentElement.getAttribute("data-coty-year")).toBe(
      "2026"
    );

    delete window.__cotyScaleSrc;
  });
});
