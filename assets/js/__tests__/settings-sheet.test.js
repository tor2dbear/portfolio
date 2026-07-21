/**
 * Settings bottom-sheet detents (settings-dropdown.js): the pure gesture
 * decision that maps a handle drag to dismiss / expand / collapse / snapback.
 * Positive delta is a downward pull, negative is upward.
 */
describe("settings sheet detent gesture", () => {
  let decideSheetGesture;

  beforeAll(() => {
    jest.isolateModules(() => {
      require("../settings-dropdown.js");
    });
    decideSheetGesture = window.__settingsSheetInternals.decideSheetGesture;
  });

  const DISMISS = 120; // dismiss threshold (px)
  const DETENT = 48; // detent-switch threshold (px)

  describe("from the resting detent", () => {
    test("a downward pull past the dismiss threshold dismisses", () => {
      expect(decideSheetGesture(160, false, true, DISMISS, DETENT)).toBe(
        "dismiss"
      );
    });

    test("an upward pull past the detent threshold expands when content overflows", () => {
      expect(decideSheetGesture(-60, false, true, DISMISS, DETENT)).toBe(
        "expand"
      );
    });

    test("an upward pull does NOT expand when there is nothing to reveal", () => {
      expect(decideSheetGesture(-60, false, false, DISMISS, DETENT)).toBe(
        "snapback"
      );
    });

    test("a downward pull short of the dismiss threshold snaps back", () => {
      expect(decideSheetGesture(40, false, true, DISMISS, DETENT)).toBe(
        "snapback"
      );
    });

    test("an upward pull short of the detent threshold snaps back", () => {
      expect(decideSheetGesture(-20, false, true, DISMISS, DETENT)).toBe(
        "snapback"
      );
    });
  });

  describe("from the expanded detent", () => {
    test("a downward pull past the detent threshold collapses to rest", () => {
      expect(decideSheetGesture(60, true, true, DISMISS, DETENT)).toBe(
        "collapse"
      );
    });

    test("a downward pull short of the detent threshold stays expanded", () => {
      expect(decideSheetGesture(20, true, true, DISMISS, DETENT)).toBe(
        "snapback"
      );
    });

    test("an upward pull stays expanded (already full)", () => {
      expect(decideSheetGesture(-80, true, true, DISMISS, DETENT)).toBe(
        "snapback"
      );
    });
  });
});
