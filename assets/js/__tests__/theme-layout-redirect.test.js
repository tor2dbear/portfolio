/**
 * Regression test for theme.js setLayout() — the storage-fail redirect guard.
 *
 * On a terminal-exempt page (ui-library, palette generator), picking the
 * "terminal" layout can't render a terminal in place, so setLayout persists the
 * choice and redirects to the home terminal, which reads `theme-layout` on load
 * to boot into terminal mode. If persisting the choice FAILS (localStorage
 * throws — private mode, quota), the redirect would navigate the visitor away
 * for nothing: home would read no preference and open in column. So the guard
 * must skip the redirect when the write didn't stick.
 *
 * This is review-lens.md category #4 (storage/persistence that can fail):
 * downstream navigation must branch on the write's success, not assume it.
 *
 * jsdom makes real (cross-document) navigation a no-op and won't let us replace
 * window.location, but it DOES implement same-document hash navigation. So the
 * test points data-home-url at a hash: the exact redirect line
 * (`window.location.href = homeUrl`) then moves location.hash when it fires,
 * which is directly observable, and leaves it untouched when it doesn't.
 */

require("../theme.js"); // publishes window.Theme at IIFE eval
const { setLayout } = window.Theme;

const HOME_HASH = "#terminal-home";

describe("setLayout('terminal') on a terminal-exempt page", () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = "";
    document.documentElement.setAttribute("data-terminal-exempt", "");
    document.documentElement.setAttribute("data-home-url", HOME_HASH);
  });

  afterEach(() => {
    window.location.hash = "";
    document.documentElement.removeAttribute("data-terminal-exempt");
    document.documentElement.removeAttribute("data-home-url");
    jest.restoreAllMocks();
  });

  function redirected() {
    return window.location.hash === HOME_HASH;
  }

  test("redirects to the home terminal when the preference persisted", () => {
    setLayout("terminal");
    expect(localStorage.getItem("theme-layout")).toBe("terminal");
    expect(redirected()).toBe(true);
  });

  test("does NOT redirect when localStorage.setItem throws (preference not saved)", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    setLayout("terminal");
    // The write was lost, so navigating home would strand the visitor in column.
    expect(redirected()).toBe(false);
  });
});
