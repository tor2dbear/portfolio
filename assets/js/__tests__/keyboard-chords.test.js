describe("keyboard chords", () => {
  function loadModule() {
    jest.isolateModules(() => {
      require("../keyboard-chords.js");
    });
    document.dispatchEvent(new window.Event("DOMContentLoaded"));
  }

  function pressKey(key) {
    document.dispatchEvent(
      new window.KeyboardEvent("keydown", { key, bubbles: true })
    );
  }

  beforeEach(() => {
    jest.resetModules();
    document.documentElement.removeAttribute("data-work-mode");
    document.body.innerHTML = `
      <div data-shortcut="M"></div>
      <div data-shortcut="T"></div>
      <div data-shortcut="E"></div>
    `;

    window.ThemeActions = {
      setMode: jest.fn(),
      setTypography: jest.fn(),
      getTypographyOrder: jest.fn(() => [
        "editorial",
        "refined",
        "expressive",
        "technical",
        "system",
      ]),
      togglePantone: jest.fn(),
      toggleBlend: jest.fn(),
      toggleGrain: jest.fn(),
      toggleReducedMotion: jest.fn(),
    };

    window.GridOverlayActions = {
      toggle: jest.fn(),
    };

    window.LanguageActions = {
      setLanguage: jest.fn(),
    };
  });

  test("mode chord uses semantic letters", () => {
    loadModule();

    pressKey("m");
    pressKey("d");

    expect(window.ThemeActions.setMode).toHaveBeenCalledWith("dark");
  });

  test("mode chord is gated on a work-mode-locked page", () => {
    // On a hard-locked page (data-work-mode) the mode chord must not arm — the
    // visible toggle is hidden, so M + L/D/S can't silently no-op. Pressing M
    // flashes a "Mode locked" notice and the follow-up key is inert.
    document.documentElement.setAttribute("data-work-mode", "dark");
    loadModule();

    pressKey("m");
    pressKey("d"); // inert: the chord never armed, so D is not a mode selector

    expect(window.ThemeActions.setMode).not.toHaveBeenCalled();
    const hud = document.querySelector(".chord-hud");
    expect(hud).not.toBeNull();
    expect(hud.hasAttribute("hidden")).toBe(false);
    expect(hud.textContent).toContain("Mode locked");

    document.documentElement.removeAttribute("data-work-mode");
  });

  test("typography chord uses semantic letters", () => {
    loadModule();

    pressKey("t");
    pressKey("x");

    expect(window.ThemeActions.setTypography).toHaveBeenCalledWith(
      "expressive"
    );
  });

  test("typography chord reaches system", () => {
    loadModule();

    pressKey("t");
    pressKey("s");

    expect(window.ThemeActions.setTypography).toHaveBeenCalledWith("system");
  });

  test("effects chord uses semantic letters", () => {
    loadModule();

    pressKey("e");
    pressKey("b");

    expect(window.ThemeActions.toggleBlend).toHaveBeenCalled();
    expect(window.GridOverlayActions.toggle).not.toHaveBeenCalled();
  });
});
