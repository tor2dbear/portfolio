/**
 * Language navigation (language-dropdown.js): the settings-panel language radio.
 * In the terminal layout it routes through the terminal's in-place swap seam
 * (no reload); everywhere else it does the normal full navigation.
 */
describe("language navigation", () => {
  function load() {
    jest.isolateModules(() => {
      require("../language-dropdown.js");
    });
    document.dispatchEvent(new window.Event("DOMContentLoaded"));
  }

  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
    document.documentElement.removeAttribute("data-layout");
    delete window.Terminal;
    document.body.innerHTML =
      '<label class="language-option">' +
      '<input type="radio" data-language-code="sv" data-language-name="Svenska"' +
      ' data-language-href="/sv/writing/" /></label>';
  });

  function fireChange() {
    document
      .querySelector('input[data-language-code="sv"]')
      .dispatchEvent(new window.Event("change"));
  }

  test("in terminal layout, routes through the terminal swap seam (no reload toast)", () => {
    document.documentElement.setAttribute("data-layout", "terminal");
    window.Terminal = { switchLanguage: jest.fn() };
    load();
    fireChange();
    expect(window.Terminal.switchLanguage).toHaveBeenCalledWith("/sv/writing/");
    // The seam prints its own confirmation/toast, so no reload-only pending toast.
    expect(localStorage.getItem("pending-toast")).toBeNull();
  });

  test("in terminal layout without the seam, falls back to a full navigation", () => {
    document.documentElement.setAttribute("data-layout", "terminal");
    // window.Terminal absent (older engine) → the normal reload path.
    load();
    fireChange();
    expect(localStorage.getItem("pending-toast")).toContain("Svenska");
  });

  test("outside terminal layout, sets the pending toast and navigates as before", () => {
    window.Terminal = { switchLanguage: jest.fn() };
    load();
    fireChange();
    // Non-terminal pages are untouched: no swap, the reload-toast is stored.
    expect(window.Terminal.switchLanguage).not.toHaveBeenCalled();
    expect(localStorage.getItem("pending-toast")).toContain("Svenska");
  });
});
