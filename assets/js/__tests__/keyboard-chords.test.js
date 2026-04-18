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

  test("typography chord uses semantic letters", () => {
    loadModule();

    pressKey("t");
    pressKey("x");

    expect(window.ThemeActions.setTypography).toHaveBeenCalledWith(
      "expressive"
    );
  });

  test("effects chord uses semantic letters", () => {
    loadModule();

    pressKey("e");
    pressKey("b");

    expect(window.ThemeActions.toggleBlend).toHaveBeenCalled();
    expect(window.GridOverlayActions.toggle).not.toHaveBeenCalled();
  });
});
