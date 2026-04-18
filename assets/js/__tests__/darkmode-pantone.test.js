describe("darkmode pantone transport", () => {
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
      getEntry: jest.fn((year) =>
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
      require("../darkmode.js");
    });
    document.dispatchEvent(new window.Event("DOMContentLoaded"));
  }

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    localStorage.clear();
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
        <div data-js="coty-transport" hidden>
          <button
            data-js="coty-transport-trigger"
            aria-label="Show Pantone controls"
          >
            Trigger
          </button>
          <button
            data-js="coty-transport-toggle"
            data-label-play="Play Pantone"
            data-label-pause="Pause Pantone"
            aria-label="Play Pantone"
            aria-pressed="false"
          >
            <svg data-js="coty-play-icon"></svg>
          </button>
          <button data-js="coty-stop" aria-label="Stop Pantone">Stop</button>
          <button data-js="coty-prev" aria-label="Previous">Prev</button>
          <button data-js="coty-next" aria-label="Next">Next</button>
          <button data-js="coty-shuffle" aria-label="Shuffle">Shuffle</button>
        </div>
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

  test("activating pantone mode starts paused on the latest year", () => {
    loadModule();

    document.querySelector('[data-js="coty-mode-toggle"]').click();

    expect(document.documentElement.getAttribute("data-palette")).toBe(
      "pantone"
    );
    expect(document.documentElement.getAttribute("data-pantone-state")).toBe(
      "paused"
    );
    expect(document.documentElement.getAttribute("data-coty-year")).toBe(
      "2026"
    );
    expect(document.querySelector('[data-js="coty-transport"]').hidden).toBe(
      false
    );
    expect(
      document
        .querySelector('[data-js="coty-transport"]')
        .getAttribute("data-ui-state")
    ).toBe("expanded");
    expect(
      document
        .querySelector('[data-js="coty-mode-toggle"]')
        .getAttribute("aria-pressed")
    ).toBe("true");
    expect(
      document
        .querySelector('[data-js="coty-transport-toggle"]')
        .getAttribute("aria-label")
    ).toBe("Play Pantone");
  });

  test("transport toggles between play and pause and stop returns to inactive", () => {
    loadModule();

    document.querySelector('[data-js="coty-mode-toggle"]').click();
    window.ThemeActions.playPantone();

    expect(document.documentElement.getAttribute("data-pantone-state")).toBe(
      "playing"
    );
    expect(
      document
        .querySelector('[data-js="coty-transport-toggle"]')
        .getAttribute("aria-label")
    ).toBe("Pause Pantone");

    window.ThemeActions.pausePantone();

    expect(document.documentElement.getAttribute("data-pantone-state")).toBe(
      "paused"
    );

    window.ThemeActions.stopPantone();

    expect(document.documentElement.getAttribute("data-pantone-state")).toBe(
      "inactive"
    );
    expect(document.documentElement.getAttribute("data-palette")).toBe(
      "standard"
    );
    expect(document.querySelector('[data-js="coty-transport"]').hidden).toBe(
      true
    );
  });

  test("transport collapses after inactivity and expands again via trigger", () => {
    loadModule();

    document.querySelector('[data-js="coty-mode-toggle"]').click();

    jest.advanceTimersByTime(4000);

    expect(
      document
        .querySelector('[data-js="coty-transport"]')
        .getAttribute("data-ui-state")
    ).toBe("collapsed");

    document.querySelector('[data-js="coty-transport-trigger"]').click();

    expect(
      document
        .querySelector('[data-js="coty-transport"]')
        .getAttribute("data-ui-state")
    ).toBe("expanded");
  });

  test("collapsed transport state persists across reload", () => {
    localStorage.setItem("theme-palette", "pantone");
    localStorage.setItem("theme-pantone-state", "paused");
    localStorage.setItem("theme-pantone-transport-ui", "collapsed");

    loadModule();

    expect(document.querySelector('[data-js="coty-transport"]').hidden).toBe(
      false
    );
    expect(
      document
        .querySelector('[data-js="coty-transport"]')
        .getAttribute("data-ui-state")
    ).toBe("collapsed");
  });

  test("collapsed transport uses hover intent before expanding", () => {
    loadModule();

    document.querySelector('[data-js="coty-mode-toggle"]').click();
    jest.advanceTimersByTime(4000);

    const trigger = document.querySelector('[data-js="coty-transport-trigger"]');
    trigger.dispatchEvent(
      new window.MouseEvent("mouseenter", { bubbles: true, relatedTarget: null })
    );

    jest.advanceTimersByTime(220);

    expect(
      document
        .querySelector('[data-js="coty-transport"]')
        .getAttribute("data-ui-state")
    ).toBe("collapsed");

    trigger.dispatchEvent(
      new window.MouseEvent("mouseenter", { bubbles: true, relatedTarget: null })
    );

    jest.advanceTimersByTime(119);

    expect(
      document
        .querySelector('[data-js="coty-transport"]')
        .getAttribute("data-ui-state")
    ).toBe("collapsed");

    jest.advanceTimersByTime(1);

    expect(
      document
        .querySelector('[data-js="coty-transport"]')
        .getAttribute("data-ui-state")
    ).toBe("expanded");
  });

  test("collapsed transport expands on touch interaction", () => {
    loadModule();

    document.querySelector('[data-js="coty-mode-toggle"]').click();
    jest.advanceTimersByTime(4000);

    const trigger = document.querySelector('[data-js="coty-transport-trigger"]');
    trigger.dispatchEvent(new window.Event("touchend", { bubbles: true }));

    expect(
      document
        .querySelector('[data-js="coty-transport"]')
        .getAttribute("data-ui-state")
    ).toBe("expanded");
  });
});
